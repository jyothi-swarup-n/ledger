from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

FinanceType = Literal["Work", "Personal"]
CategoryScope = Literal["Work", "Personal", "Both"]
Direction = Literal["Credit", "Debit"]


class Doc(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    updated_at: str
    deleted: bool = False


# ---------- Auth ----------
class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=20)
    country_code: Optional[str] = Field(default="+91", max_length=6)


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    device: Optional[str] = None


class EmailOnly(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    device: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    id_token: str
    device: Optional[str] = None


class GoogleSessionRequest(BaseModel):
    session_id: Optional[str] = None
    device: Optional[str] = None


class RefreshRequest(BaseModel):
    refresh_token: str


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6)
    new_password: str = Field(min_length=6, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: str = Field(min_length=6, max_length=128)


class UpdateProfileRequest(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    profile_aliases: Optional[dict[str, str]] = None
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)


class DeleteAccountRequest(BaseModel):
    password: Optional[str] = None


# ---------- Ledger entities (client supplies id so they can be created offline) ----------
class Subcategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str = Field(min_length=1, max_length=80)
    individualBudget: float = 0
    recurringDueDate: Optional[int] = Field(default=None, ge=1, le=31)


class BankAccountIn(BaseModel):
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=80)
    initialOpeningBalance: float = 0
    accountNumberMask: Optional[str] = None
    color: Optional[str] = None


class CreditCardIn(BaseModel):
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=80)
    creditLimit: float = 0
    initialOpeningBalance: float = 0
    cardNumberMask: Optional[str] = None
    dueDateDay: Optional[int] = Field(default=None, ge=1, le=31)
    autoPay: bool = False
    color: Optional[str] = None


class CategoryIn(BaseModel):
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=80)
    type: CategoryScope
    icon: Optional[str] = None
    isTransfer: bool = False
    subcategories: list[Subcategory] = []


class SubcategoryIn(BaseModel):
    id: Optional[str] = None
    name: str = Field(min_length=1, max_length=80)
    individualBudget: float = 0
    recurringDueDate: Optional[int] = Field(default=None, ge=1, le=31)


class TransactionIn(BaseModel):
    id: Optional[str] = None
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    description: str = Field(min_length=1, max_length=200)
    type: FinanceType
    categoryId: str
    subcategoryId: Optional[str] = None
    accountOrCardId: str
    direction: Direction
    amount: float = Field(gt=0)
    notes: Optional[str] = Field(default=None, max_length=1000)
    receiptImage: Optional[str] = None
    splitWith: Optional[list[str]] = None


class BudgetTargetIn(BaseModel):
    monthKey: str = Field(pattern=r"^\d{4}-\d{2}$")
    categoryId: str
    subcategoryId: Optional[str] = None
    amount: float = Field(ge=0)


# ---------- Sync ----------
class SyncPush(BaseModel):
    bank_accounts: list[dict] = []
    credit_cards: list[dict] = []
    categories: list[dict] = []
    transactions: list[dict] = []
    budget_targets: list[dict] = []
