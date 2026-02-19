import click
from api.models import db, User, Group, Plan, PlanStatus
from werkzeug.security import generate_password_hash
from datetime import datetime


def setup_commands(app):

    @app.cli.command("insert-test-data")
    def insert_test_data():
        """Inserta datos de demo para AmigoPlan."""
        db.drop_all()
        db.create_all()

        u1 = User(email="marta@test.com",  username="Marta", password=generate_password_hash("1234"), avatar_color="#FF6B35", is_active=True)
        u2 = User(email="dani@test.com",   username="Dani",  password=generate_password_hash("1234"), avatar_color="#6B4EFF", is_active=True)
        u3 = User(email="lola@test.com",   username="Lola",  password=generate_password_hash("1234"), avatar_color="#FF4081", is_active=True)
        u4 = User(email="juan@test.com",   username="Juan",  password=generate_password_hash("1234"), avatar_color="#00BCD4", is_active=True)

        db.session.add_all([u1, u2, u3, u4])
        db.session.flush()

        g1 = Group(name="La Pandilla", admin_id=u1.id, emoji="🔥", description="Los mejores planes de siempre")
        g2 = Group(name="Los Senderistas", admin_id=u4.id, emoji="🏔️", description="Aventura y naturaleza")
        db.session.add_all([g1, g2])
        db.session.flush()

        g1.members.extend([u1, u2, u3, u4])
        g2.members.extend([u4, u1, u2])
        db.session.flush()

        p1 = Plan(title="Cena de Cumpleaños", group_id=g1.id, organizer_id=u2.id, admin_id=u1.id,
                  category="cena", location="Terraza Luna", status=PlanStatus.CONFIRMADO,
                  scheduled_date=datetime(2026, 6, 21, 21, 0), budget_level="$$", energy_level="chill")
        p2 = Plan(title="Ruta por la Sierra", group_id=g2.id, organizer_id=u1.id, admin_id=u4.id,
                  category="aventura", location="Navacerrada", status=PlanStatus.PROPUESTA,
                  scheduled_date=datetime(2026, 7, 5, 8, 0), budget_level="$", energy_level="full")
        p3 = Plan(title="Game Night", group_id=g1.id, organizer_id=u3.id, admin_id=u1.id,
                  category="ocio", location="Casa de Lola", status=PlanStatus.VOTACION,
                  scheduled_date=datetime(2026, 6, 28, 20, 0), budget_level="$", energy_level="chill")

        db.session.add_all([p1, p2, p3])
        db.session.commit()

        print("✅ Datos de demo creados:")
        print("   marta@test.com / 1234")
        print("   dani@test.com  / 1234")
        print("   lola@test.com  / 1234")
        print("   juan@test.com  / 1234")

    # Keep the original command from the base repo too
    @app.cli.command("insert-test-users")
    @click.argument("count")
    def insert_test_users(count):
        print("Creating test users")
        for x in range(1, int(count) + 1):
            user = User()
            user.email    = "test_user" + str(x) + "@test.com"
            user.username = "user" + str(x)
            user.password = generate_password_hash("123456")
            user.is_active = True
            db.session.add(user)
            db.session.commit()
            print("User: ", user.email, " created.")
        print("All test users created")
