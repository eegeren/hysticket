import enum


class Category(str, enum.Enum):
    INTERNET_WAN = "INTERNET_WAN"
    LAN_WIFI = "LAN_WIFI"
    POS = "POS"
    PRINTER_BARCODE = "PRINTER_BARCODE"
    PC_TABLET = "PC_TABLET"
    ACCOUNT_ACCESS = "ACCOUNT_ACCESS"
    APP_SERVER = "APP_SERVER"
    OTHER = "OTHER"


class Impact(str, enum.Enum):
    SALES_STOPPED = "SALES_STOPPED"
    PARTIAL = "PARTIAL"
    INFO = "INFO"


class Priority(str, enum.Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"


class Status(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_STORE = "WAITING_STORE"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class CloseCode(str, enum.Enum):
    FIXED = "FIXED"
    USER_ERROR = "USER_ERROR"
    VENDOR = "VENDOR"
    DUPLICATE = "DUPLICATE"
    CANNOT_REPRODUCE = "CANNOT_REPRODUCE"
    OTHER = "OTHER"


class AuthorRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STORE = "STORE"


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    STORE = "store"
