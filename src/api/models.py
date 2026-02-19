from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Integer, Float, Boolean, Text, DateTime, Enum, ForeignKey, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from datetime import datetime
import enum

db = SQLAlchemy()

class PlanStatus(enum.Enum):
    PROPUESTA  = "propuesta"
    VOTACION   = "votacion"
    CONFIRMADO = "confirmado"
    EN_CURSO   = "en_curso"
    CERRADO    = "cerrado"

class VoteType(enum.Enum):
    SI          = "si"
    NO          = "no"
    ME_DA_IGUAL = "me_da_igual"

class SplitType(enum.Enum):
    IGUAL          = "igual"
    POR_ITEMS      = "por_items"
    POR_PORCENTAJE = "por_porcentaje"
    UNO_PAGA       = "uno_paga"

group_members = Table(
    "group_members", db.metadata,
    Column("user_id",  Integer, ForeignKey("user.id"),  primary_key=True),
    Column("group_id", Integer, ForeignKey("group.id"), primary_key=True),
)

class User(db.Model):
    id:            Mapped[int]      = mapped_column(primary_key=True)
    email:         Mapped[str]      = mapped_column(String(120), unique=True, nullable=False)
    password:      Mapped[str]      = mapped_column(String(256), nullable=False)
    username:      Mapped[str]      = mapped_column(String(80),  unique=True, nullable=False)
    is_active:     Mapped[bool]     = mapped_column(Boolean(), default=True)
    avatar_color:  Mapped[str]      = mapped_column(String(20),  default="#FF6B35")
    cancellations: Mapped[int]      = mapped_column(Integer, default=0)
    created_at:    Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    groups:         Mapped[List["Group"]]        = relationship("Group", secondary=group_members, back_populates="members")
    groups_admin:   Mapped[List["Group"]]        = relationship("Group", foreign_keys="Group.admin_id", back_populates="admin")
    plans_org:      Mapped[List["Plan"]]         = relationship("Plan",  foreign_keys="Plan.organizer_id", back_populates="organizer")
    votes:          Mapped[List["Vote"]]         = relationship("Vote",  back_populates="voter")
    expense_splits: Mapped[List["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="user")

    def serialize(self):
        return {
            "id": self.id, "email": self.email, "username": self.username,
            "is_active": self.is_active, "avatar_color": self.avatar_color,
            "avatar_initial": self.username[0].upper() if self.username else "?",
            "cancellations": self.cancellations, "created_at": self.created_at.isoformat(),
        }

class Group(db.Model):
    id:          Mapped[int]      = mapped_column(primary_key=True)
    name:        Mapped[str]      = mapped_column(String(100), nullable=False)
    description: Mapped[str]      = mapped_column(Text, default="")
    emoji:       Mapped[str]      = mapped_column(String(10), default="🎉")
    admin_id:    Mapped[int]      = mapped_column(ForeignKey("user.id"), nullable=False)
    created_at:  Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    admin:   Mapped["User"]       = relationship("User", foreign_keys=[admin_id], back_populates="groups_admin")
    members: Mapped[List["User"]] = relationship("User", secondary=group_members, back_populates="groups")
    plans:   Mapped[List["Plan"]] = relationship("Plan", back_populates="group", cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id, "name": self.name, "description": self.description,
            "emoji": self.emoji, "admin_id": self.admin_id,
            "admin_username": self.admin.username if self.admin else None,
            "member_count": len(self.members),
            "members": [{"id": m.id, "username": m.username,
                         "avatar_initial": m.username[0].upper(), "avatar_color": m.avatar_color}
                        for m in self.members],
        }

class Plan(db.Model):
    id:             Mapped[int]               = mapped_column(primary_key=True)
    title:          Mapped[str]               = mapped_column(String(150), nullable=False)
    description:    Mapped[str]               = mapped_column(Text, default="")
    group_id:       Mapped[int]               = mapped_column(ForeignKey("group.id"), nullable=False)
    organizer_id:   Mapped[Optional[int]]     = mapped_column(ForeignKey("user.id"),  nullable=True)
    admin_id:       Mapped[int]               = mapped_column(ForeignKey("user.id"),  nullable=False)
    status:         Mapped[PlanStatus]        = mapped_column(Enum(PlanStatus), default=PlanStatus.PROPUESTA)
    category:       Mapped[str]               = mapped_column(String(50),  default="cena")
    location:       Mapped[str]               = mapped_column(String(200), default="")
    scheduled_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    budget_level:   Mapped[str]               = mapped_column(String(5),   default="$$")
    energy_level:   Mapped[str]               = mapped_column(String(20),  default="normal")
    duration:       Mapped[str]               = mapped_column(String(20),  default="medio_dia")
    rating:         Mapped[Optional[float]]   = mapped_column(Float, nullable=True)
    challenge_type: Mapped[Optional[str]]     = mapped_column(String(50),  nullable=True)
    is_surprise:    Mapped[bool]              = mapped_column(Boolean, default=False)
    surprise_clue:  Mapped[Optional[str]]     = mapped_column(String(200), nullable=True)
    template:       Mapped[Optional[str]]     = mapped_column(String(50),  nullable=True)
    created_at:     Mapped[datetime]          = mapped_column(DateTime, default=datetime.utcnow)
    closed_at:      Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    group:      Mapped["Group"]             = relationship("Group", back_populates="plans")
    organizer:  Mapped[Optional["User"]]    = relationship("User", foreign_keys=[organizer_id], back_populates="plans_org")
    admin_user: Mapped["User"]              = relationship("User", foreign_keys=[admin_id])
    votes:      Mapped[List["Vote"]]        = relationship("Vote",       back_populates="plan",  cascade="all, delete-orphan")
    expenses:   Mapped[List["Expense"]]     = relationship("Expense",    back_populates="plan",  cascade="all, delete-orphan")
    options:    Mapped[List["PlanOption"]]  = relationship("PlanOption", back_populates="plan",  cascade="all, delete-orphan")
    memories:   Mapped[List["PlanMemory"]]  = relationship("PlanMemory", back_populates="plan",  cascade="all, delete-orphan")

    def serialize(self):
        return {
            "id": self.id, "title": self.title, "description": self.description,
            "group_id": self.group_id, "organizer_id": self.organizer_id,
            "organizer_username": self.organizer.username if self.organizer else None,
            "admin_id": self.admin_id,
            "admin_username": self.admin_user.username if self.admin_user else None,
            "status": self.status.value, "category": self.category, "location": self.location,
            "scheduled_date": self.scheduled_date.isoformat() if self.scheduled_date else None,
            "budget_level": self.budget_level, "energy_level": self.energy_level,
            "duration": self.duration, "rating": self.rating,
            "challenge_type": self.challenge_type, "is_surprise": self.is_surprise,
            "surprise_clue": self.surprise_clue, "template": self.template,
            "created_at": self.created_at.isoformat(),
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
        }

class PlanOption(db.Model):
    id:             Mapped[int]             = mapped_column(primary_key=True)
    plan_id:        Mapped[int]             = mapped_column(ForeignKey("plan.id"), nullable=False)
    title:          Mapped[str]             = mapped_column(String(150), nullable=False)
    description:    Mapped[str]             = mapped_column(Text, default="")
    location:       Mapped[str]             = mapped_column(String(200), default="")
    estimated_cost: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    plan:  Mapped["Plan"]       = relationship("Plan", back_populates="options")
    votes: Mapped[List["Vote"]] = relationship("Vote", back_populates="option")

    def serialize(self):
        counts = {"si": 0, "no": 0, "me_da_igual": 0}
        for v in self.votes:
            counts[v.vote_type.value] += 1
        return {"id": self.id, "plan_id": self.plan_id, "title": self.title,
                "description": self.description, "location": self.location,
                "estimated_cost": self.estimated_cost, "vote_counts": counts}

class Vote(db.Model):
    id:         Mapped[int]             = mapped_column(primary_key=True)
    plan_id:    Mapped[int]             = mapped_column(ForeignKey("plan.id"),        nullable=False)
    option_id:  Mapped[Optional[int]]   = mapped_column(ForeignKey("plan_option.id"), nullable=True)
    user_id:    Mapped[int]             = mapped_column(ForeignKey("user.id"),        nullable=False)
    vote_type:  Mapped[VoteType]        = mapped_column(Enum(VoteType), nullable=False)
    is_veto:    Mapped[bool]            = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime]        = mapped_column(DateTime, default=datetime.utcnow)

    plan:   Mapped["Plan"]                 = relationship("Plan",       back_populates="votes")
    option: Mapped[Optional["PlanOption"]] = relationship("PlanOption", back_populates="votes")
    voter:  Mapped["User"]                 = relationship("User",       back_populates="votes")

    def serialize(self):
        return {"id": self.id, "plan_id": self.plan_id, "option_id": self.option_id,
                "user_id": self.user_id, "vote_type": self.vote_type.value, "is_veto": self.is_veto}

class Expense(db.Model):
    id:           Mapped[int]       = mapped_column(primary_key=True)
    plan_id:      Mapped[int]       = mapped_column(ForeignKey("plan.id"),  nullable=False)
    description:  Mapped[str]       = mapped_column(String(200), nullable=False)
    total_amount: Mapped[float]     = mapped_column(Float, nullable=False)
    paid_by_id:   Mapped[int]       = mapped_column(ForeignKey("user.id"), nullable=False)
    split_type:   Mapped[SplitType] = mapped_column(Enum(SplitType), default=SplitType.IGUAL)
    created_at:   Mapped[datetime]  = mapped_column(DateTime, default=datetime.utcnow)

    plan:    Mapped["Plan"]               = relationship("Plan", back_populates="expenses")
    paid_by: Mapped["User"]               = relationship("User")
    splits:  Mapped[List["ExpenseSplit"]] = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")

    def serialize(self):
        return {"id": self.id, "plan_id": self.plan_id, "description": self.description,
                "total_amount": self.total_amount, "paid_by_id": self.paid_by_id,
                "paid_by_username": self.paid_by.username if self.paid_by else None,
                "split_type": self.split_type.value, "splits": [s.serialize() for s in self.splits],
                "created_at": self.created_at.isoformat()}

class ExpenseSplit(db.Model):
    id:         Mapped[int]   = mapped_column(primary_key=True)
    expense_id: Mapped[int]   = mapped_column(ForeignKey("expense.id"), nullable=False)
    user_id:    Mapped[int]   = mapped_column(ForeignKey("user.id"),    nullable=False)
    amount:     Mapped[float] = mapped_column(Float,   nullable=False)
    is_paid:    Mapped[bool]  = mapped_column(Boolean, default=False)

    expense: Mapped["Expense"] = relationship("Expense", back_populates="splits")
    user:    Mapped["User"]    = relationship("User",    back_populates="expense_splits")

    def serialize(self):
        return {"id": self.id, "expense_id": self.expense_id, "user_id": self.user_id,
                "username": self.user.username if self.user else None,
                "amount": self.amount, "is_paid": self.is_paid}

class PlanMemory(db.Model):
    id:         Mapped[int]      = mapped_column(primary_key=True)
    plan_id:    Mapped[int]      = mapped_column(ForeignKey("plan.id"), nullable=False)
    user_id:    Mapped[int]      = mapped_column(ForeignKey("user.id"), nullable=False)
    phrase:     Mapped[str]      = mapped_column(String(500), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    plan: Mapped["Plan"] = relationship("Plan", back_populates="memories")
    user: Mapped["User"] = relationship("User")

    def serialize(self):
        return {"id": self.id, "plan_id": self.plan_id, "user_id": self.user_id,
                "username": self.user.username if self.user else None,
                "phrase": self.phrase, "created_at": self.created_at.isoformat()}
