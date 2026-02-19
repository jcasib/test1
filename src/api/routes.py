import os
from flask import Blueprint, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import random

from api.models import (db, User, Group, Plan, PlanOption, Vote,
                        Expense, ExpenseSplit, PlanMemory,
                        PlanStatus, VoteType, SplitType)
from api.utils import APIException

api = Blueprint('api', __name__)
CORS(api)

AVATAR_COLORS = ["#FF6B35", "#6B4EFF", "#FF4081", "#00BCD4", "#4CAF50", "#FF9800"]

# ── Auth ──────────────────────────────────────────────────────────────────────

@api.route('/auth/register', methods=['POST'])
def register():
    body = request.get_json()
    if not body:
        raise APIException("No data", 400)
    email    = body.get("email", "").strip().lower()
    username = body.get("username", "").strip()
    password = body.get("password", "")
    if not email or not username or not password:
        raise APIException("email, username y password son obligatorios", 400)
    if User.query.filter_by(email=email).first():
        raise APIException("Email ya registrado", 409)
    if User.query.filter_by(username=username).first():
        raise APIException("Username ya en uso", 409)
    user = User(
        email=email, username=username,
        password=generate_password_hash(password),
        avatar_color=random.choice(AVATAR_COLORS),
        is_active=True
    )
    db.session.add(user)
    db.session.commit()
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.serialize()}), 201


@api.route('/auth/login', methods=['POST'])
def login():
    body = request.get_json()
    if not body:
        raise APIException("No data", 400)
    email    = body.get("email", "").strip().lower()
    password = body.get("password", "")
    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        raise APIException("Credenciales incorrectas", 401)
    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.serialize()}), 200


@api.route('/auth/me', methods=['GET'])
@jwt_required()
def get_me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        raise APIException("Usuario no encontrado", 404)
    return jsonify(user.serialize()), 200


# ── Users ─────────────────────────────────────────────────────────────────────

@api.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    q = request.args.get("q", "").strip()
    if not q or len(q) < 2:
        return jsonify([]), 200
    users = User.query.filter(User.username.ilike(f"%{q}%")).limit(10).all()
    return jsonify([u.serialize() for u in users]), 200


# ── Groups ────────────────────────────────────────────────────────────────────

@api.route('/groups', methods=['GET'])
@jwt_required()
def get_groups():
    user = User.query.get(int(get_jwt_identity()))
    return jsonify([g.serialize() for g in user.groups]), 200


@api.route('/groups', methods=['POST'])
@jwt_required()
def create_group():
    user = User.query.get(int(get_jwt_identity()))
    body = request.get_json()
    if not body or not body.get("name"):
        raise APIException("name es obligatorio", 400)
    group = Group(
        name=body["name"],
        description=body.get("description", ""),
        emoji=body.get("emoji", "🎉"),
        admin_id=user.id
    )
    group.members.append(user)
    db.session.add(group)
    db.session.commit()
    return jsonify(group.serialize()), 201


@api.route('/groups/<int:group_id>', methods=['GET'])
@jwt_required()
def get_group(group_id):
    group = db.get_or_404(Group, group_id)
    return jsonify(group.serialize()), 200


@api.route('/groups/<int:group_id>/invite', methods=['POST'])
@jwt_required()
def invite_to_group(group_id):
    group    = db.get_or_404(Group, group_id)
    body     = request.get_json()
    username = body.get("username", "").strip()
    target   = User.query.filter_by(username=username).first()
    if not target:
        raise APIException(f"Usuario '{username}' no encontrado", 404)
    if target in group.members:
        raise APIException("Ya es miembro del grupo", 409)
    group.members.append(target)
    db.session.commit()
    return jsonify(group.serialize()), 200


@api.route('/groups/<int:group_id>/spin', methods=['POST'])
@jwt_required()
def spin_plan_master(group_id):
    group    = db.get_or_404(Group, group_id)
    eligible = [m for m in group.members if m.cancellations < 2] or group.members
    chosen   = random.choice(eligible)
    return jsonify({"plan_master": chosen.serialize(), "message": f"¡{chosen.username} es el Plan Master!"}), 200


# ── Plans ─────────────────────────────────────────────────────────────────────

@api.route('/plans', methods=['GET'])
@jwt_required()
def get_my_plans():
    user         = User.query.get(int(get_jwt_identity()))
    my_group_ids = [g.id for g in user.groups]
    if not my_group_ids:
        return jsonify([]), 200
    plans = Plan.query.filter(Plan.group_id.in_(my_group_ids)).order_by(Plan.created_at.desc()).all()
    return jsonify([p.serialize() for p in plans]), 200


@api.route('/groups/<int:group_id>/plans', methods=['GET'])
@jwt_required()
def get_group_plans(group_id):
    plans = Plan.query.filter_by(group_id=group_id).order_by(Plan.created_at.desc()).all()
    return jsonify([p.serialize() for p in plans]), 200


@api.route('/plans', methods=['POST'])
@jwt_required()
def create_plan():
    user = User.query.get(int(get_jwt_identity()))
    body = request.get_json()
    if not body or not body.get("title") or not body.get("group_id"):
        raise APIException("title y group_id son obligatorios", 400)
    group     = db.get_or_404(Group, int(body["group_id"]))
    scheduled = None
    if body.get("scheduled_date"):
        try:
            scheduled = datetime.fromisoformat(body["scheduled_date"])
        except ValueError:
            pass
    plan = Plan(
        title=body["title"],
        description=body.get("description", ""),
        group_id=group.id,
        admin_id=group.admin_id,
        organizer_id=user.id,
        category=body.get("category", "cena"),
        location=body.get("location", ""),
        scheduled_date=scheduled,
        budget_level=body.get("budget_level", "$$"),
        energy_level=body.get("energy_level", "normal"),
        duration=body.get("duration", "medio_dia"),
        challenge_type=body.get("challenge_type"),
        is_surprise=body.get("is_surprise", False),
        surprise_clue=body.get("surprise_clue"),
        template=body.get("template"),
    )
    db.session.add(plan)
    db.session.commit()
    return jsonify(plan.serialize()), 201


@api.route('/plans/<int:plan_id>', methods=['GET'])
@jwt_required()
def get_plan(plan_id):
    return jsonify(db.get_or_404(Plan, plan_id).serialize()), 200


@api.route('/plans/<int:plan_id>', methods=['PUT'])
@jwt_required()
def update_plan(plan_id):
    plan = db.get_or_404(Plan, plan_id)
    body = request.get_json()
    for field in ["title", "description", "location", "category",
                  "budget_level", "energy_level", "duration",
                  "challenge_type", "surprise_clue", "template"]:
        if field in body:
            setattr(plan, field, body[field])
    if "status" in body:
        plan.status = PlanStatus(body["status"])
        if body["status"] == "cerrado":
            plan.closed_at = datetime.utcnow()
    if "rating" in body:
        plan.rating = float(body["rating"])
    if body.get("scheduled_date"):
        try:
            plan.scheduled_date = datetime.fromisoformat(body["scheduled_date"])
        except ValueError:
            pass
    db.session.commit()
    return jsonify(plan.serialize()), 200


@api.route('/plans/<int:plan_id>/advance', methods=['POST'])
@jwt_required()
def advance_plan(plan_id):
    plan  = db.get_or_404(Plan, plan_id)
    order = [PlanStatus.PROPUESTA, PlanStatus.VOTACION, PlanStatus.CONFIRMADO, PlanStatus.EN_CURSO, PlanStatus.CERRADO]
    idx   = order.index(plan.status)
    if idx < len(order) - 1:
        plan.status = order[idx + 1]
        if plan.status == PlanStatus.CERRADO:
            plan.closed_at = datetime.utcnow()
        db.session.commit()
    return jsonify(plan.serialize()), 200


# ── Plan Options & Voting ─────────────────────────────────────────────────────

@api.route('/plans/<int:plan_id>/options', methods=['GET'])
@jwt_required()
def get_options(plan_id):
    return jsonify([o.serialize() for o in PlanOption.query.filter_by(plan_id=plan_id).all()]), 200


@api.route('/plans/<int:plan_id>/options', methods=['POST'])
@jwt_required()
def add_option(plan_id):
    body = request.get_json()
    if not body or not body.get("title"):
        raise APIException("title es obligatorio", 400)
    opt = PlanOption(
        plan_id=plan_id,
        title=body["title"],
        description=body.get("description", ""),
        location=body.get("location", ""),
        estimated_cost=body.get("estimated_cost"),
    )
    db.session.add(opt)
    db.session.commit()
    return jsonify(opt.serialize()), 201


@api.route('/plans/<int:plan_id>/vote', methods=['POST'])
@jwt_required()
def vote_plan(plan_id):
    user      = User.query.get(int(get_jwt_identity()))
    body      = request.get_json()
    vote_type = body.get("vote_type", "si")
    is_veto   = body.get("is_veto", False)
    option_id = body.get("option_id")

    existing = Vote.query.filter_by(plan_id=plan_id, user_id=user.id, option_id=option_id).first()
    if existing:
        existing.vote_type = VoteType(vote_type)
        existing.is_veto   = is_veto
    else:
        if is_veto and Vote.query.filter_by(plan_id=plan_id, user_id=user.id, is_veto=True).first():
            raise APIException("Ya usaste tu veto en este plan", 400)
        db.session.add(Vote(
            plan_id=plan_id, user_id=user.id,
            option_id=option_id,
            vote_type=VoteType(vote_type),
            is_veto=is_veto,
        ))
    db.session.commit()
    return jsonify({"message": "Voto registrado"}), 200


@api.route('/plans/<int:plan_id>/votes', methods=['GET'])
@jwt_required()
def get_votes(plan_id):
    votes   = Vote.query.filter_by(plan_id=plan_id).all()
    summary = {"si": 0, "no": 0, "me_da_igual": 0}
    for v in votes:
        summary[v.vote_type.value] += 1
    return jsonify({"votes": [v.serialize() for v in votes], "summary": summary}), 200


# ── Expenses ──────────────────────────────────────────────────────────────────

@api.route('/plans/<int:plan_id>/expenses', methods=['GET'])
@jwt_required()
def get_expenses(plan_id):
    return jsonify([e.serialize() for e in Expense.query.filter_by(plan_id=plan_id).all()]), 200


@api.route('/plans/<int:plan_id>/expenses', methods=['POST'])
@jwt_required()
def add_expense(plan_id):
    user = User.query.get(int(get_jwt_identity()))
    body = request.get_json()
    if not body or not body.get("description") or not body.get("total_amount"):
        raise APIException("description y total_amount son obligatorios", 400)
    plan       = db.get_or_404(Plan, plan_id)
    split_type = SplitType(body.get("split_type", "igual"))
    expense    = Expense(
        plan_id=plan_id,
        description=body["description"],
        total_amount=float(body["total_amount"]),
        paid_by_id=user.id,
        split_type=split_type,
    )
    db.session.add(expense)
    db.session.flush()

    participants = body.get("participants") or [{"user_id": m.id} for m in plan.group.members]
    total = float(body["total_amount"])
    n     = len(participants)

    for p in participants:
        uid = p["user_id"]
        if split_type == SplitType.IGUAL:
            amount = round(total / n, 2)
        elif split_type == SplitType.POR_PORCENTAJE:
            amount = round(total * float(p.get("percentage", 100 / n)) / 100, 2)
        elif split_type == SplitType.UNO_PAGA:
            amount = 0 if uid == user.id else (round(total / (n - 1), 2) if n > 1 else 0)
        else:
            amount = float(p.get("amount", total / n))
        db.session.add(ExpenseSplit(
            expense_id=expense.id, user_id=uid, amount=amount,
            is_paid=(uid == user.id)
        ))
    db.session.commit()
    return jsonify(expense.serialize()), 201


@api.route('/plans/<int:plan_id>/expenses/summary', methods=['GET'])
@jwt_required()
def expense_summary(plan_id):
    expenses = Expense.query.filter_by(plan_id=plan_id).all()
    balances = {}
    for e in expenses:
        balances.setdefault(e.paid_by_id, 0)
        balances[e.paid_by_id] += e.total_amount
        for s in e.splits:
            balances.setdefault(s.user_id, 0)
            balances[s.user_id] -= s.amount

    debtors   = sorted([(uid, -b) for uid, b in balances.items() if b < -0.01], key=lambda x: -x[1])
    creditors = sorted([(uid,  b) for uid, b in balances.items() if b >  0.01], key=lambda x: -x[1])
    transactions, di, ci = [], 0, 0
    while di < len(debtors) and ci < len(creditors):
        did, debt   = debtors[di]
        cid, credit = creditors[ci]
        amt = min(debt, credit)
        du  = User.query.get(did)
        cu  = User.query.get(cid)
        transactions.append({
            "from_user_id": did, "from_username": du.username if du else str(did),
            "to_user_id":   cid, "to_username":   cu.username if cu else str(cid),
            "amount": round(amt, 2)
        })
        debtors[di]   = (did, debt   - amt)
        creditors[ci] = (cid, credit - amt)
        if debtors[di][1]   < 0.01: di += 1
        if creditors[ci][1] < 0.01: ci += 1
    return jsonify({"transactions": transactions}), 200


@api.route('/expenses/<int:expense_id>/splits/<int:split_id>/pay', methods=['POST'])
@jwt_required()
def mark_paid(expense_id, split_id):
    split         = db.get_or_404(ExpenseSplit, split_id)
    split.is_paid = True
    db.session.commit()
    return jsonify(split.serialize()), 200


# ── Memories ──────────────────────────────────────────────────────────────────

@api.route('/plans/<int:plan_id>/memories', methods=['GET'])
@jwt_required()
def get_memories(plan_id):
    return jsonify([m.serialize() for m in PlanMemory.query.filter_by(plan_id=plan_id).all()]), 200


@api.route('/plans/<int:plan_id>/memories', methods=['POST'])
@jwt_required()
def add_memory(plan_id):
    user = User.query.get(int(get_jwt_identity()))
    body = request.get_json()
    mem  = PlanMemory(plan_id=plan_id, user_id=user.id, phrase=body.get("phrase", ""))
    db.session.add(mem)
    db.session.commit()
    return jsonify(mem.serialize()), 201


# ── Hall of Fame ──────────────────────────────────────────────────────────────

@api.route('/groups/<int:group_id>/hall-of-fame', methods=['GET'])
@jwt_required()
def hall_of_fame(group_id):
    plans = (Plan.query.filter_by(group_id=group_id)
             .filter(Plan.rating.isnot(None))
             .order_by(Plan.rating.desc())
             .limit(5).all())
    return jsonify([p.serialize() for p in plans]), 200


# ── Events ────────────────────────────────────────────────────────────────────

MOCK_TM = [
    {"id": "TM001", "name": "Festival de Verano", "date": "2026-07-15", "time": "20:00",
     "venue": "WiZink Center", "category": "Music",
     "image": "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400",
     "url": "#", "price_range": "20€-80€", "source": "ticketmaster"},
    {"id": "TM002", "name": "Noche de Stand-Up Comedy", "date": "2026-06-20", "time": "21:30",
     "venue": "Teatro Lara", "category": "Arts",
     "image": "https://images.unsplash.com/photo-1527224538127-2104bb71c51b?w=400",
     "url": "#", "price_range": "15€-25€", "source": "ticketmaster"},
    {"id": "TM003", "name": "Torneo de Dardos Regional", "date": "2026-06-28", "time": "19:30",
     "venue": "The Irish Pub", "category": "Sports",
     "image": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400",
     "url": "#", "price_range": "Gratis", "source": "ticketmaster"},
]



@api.route('/events/ticketmaster', methods=['GET'])
@jwt_required()
def search_ticketmaster():
    city = request.args.get("city", "Madrid")
    key  = os.getenv("TICKETMASTER_API_KEY", "")
    if not key or key == "YOUR_KEY_HERE":
        return jsonify({"mock": True, "events": [{**e, "city": city} for e in MOCK_TM]}), 200
    try:
        import requests as req
        r = req.get("https://app.ticketmaster.com/discovery/v2/events.json",
                    params={"apikey": key, "city": city,
                            "keyword": request.args.get("keyword", ""), "size": 10}, timeout=10)
        data   = r.json()
        events = []
        for e in data.get("_embedded", {}).get("events", []):
            dates  = e.get("dates", {}).get("start", {})
            venue  = e.get("_embedded", {}).get("venues", [{}])[0]
            prices = e.get("priceRanges", [])
            events.append({
                "id": e.get("id"), "name": e.get("name"),
                "date": dates.get("localDate"), "time": dates.get("localTime"),
                "venue": venue.get("name"), "city": venue.get("city", {}).get("name"),
                "category": e.get("classifications", [{}])[0].get("segment", {}).get("name", ""),
                "image": e.get("images", [{}])[0].get("url", ""),
                "url": e.get("url"),
                "price_range": f"{prices[0].get('min','?')}€-{prices[0].get('max','?')}€" if prices else "Ver web",
                "source": "ticketmaster",
            })
        return jsonify({"events": events}), 200
    except Exception as ex:
        raise APIException(str(ex), 500)