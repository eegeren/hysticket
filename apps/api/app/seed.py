from app.db import SessionLocal
from app.models import Device, Store
from app.security import get_password_hash


def seed():
    db = SessionLocal()
    try:
        if db.query(Store).count() > 0:
            print("Seed skipped: data already exists")
            return
        stores_data = [
            {"name": "03 Biga HYS", "code": "03_BIGA_HYS", "pin": "120003"},
            {"name": "04 Gönen HYS", "code": "04_GONEN_HYS", "pin": "120004"},
            {"name": "05 Gönen HYS", "code": "05_GONEN_HYS", "pin": "120005"},
            {"name": "07 Çanakkale Köroğlu", "code": "07_CANAKKALE_KOROGLU", "pin": "120007"},
            {"name": "08 Çanakkale HYS", "code": "08_CANAKKALE_HYS", "pin": "120008"},
            {"name": "09 Balıkesir HYS", "code": "09_BALIKESIR_HYS", "pin": "120009"},
            {"name": "14 Balıkesir Köroğlu", "code": "14_BALIKESIR_KOROGLU", "pin": "120014"},
            {"name": "17 Bursa HYS", "code": "17_BURSA_HYS", "pin": "120017"},
            {"name": "20 Karacabey HYS", "code": "20_KARACABEY_HYS", "pin": "120020"},
            {"name": "21 Kemalpaşa HYS Newstyle", "code": "21_KEMALPASA_HYS_NEWSTYLE", "pin": "120021"},
            {"name": "19 Kemalpaşa Köroğlu", "code": "19_KEMALPASA_KOROGLU", "pin": "120019"},
            {"name": "22 İnegöl HYS", "code": "22_INEGOL_HYS", "pin": "120022"},
            {"name": "24 Çanakkale Köroğlu", "code": "24_CANAKKALE_KOROGLU", "pin": "120024"},
            {"name": "25 Bandırma Mobilya", "code": "25_BANDIRMA_MOBILYA", "pin": "120025"},
            {"name": "26 Bursa Heyza", "code": "26_BURSA_HEYZA", "pin": "120026"},
        ]
        for store_data in stores_data:
            store = Store(
                name=store_data["name"],
                code=store_data["code"],
                pin_hash=get_password_hash(store_data["pin"]),
                is_active=True,
            )
            db.add(store)
            db.flush()
            devices = [
                Device(store_id=store.id, label="POS-1", type="POS"),
                Device(store_id=store.id, label="PRN-1", type="PRINTER"),
                Device(store_id=store.id, label="AP-1", type="ACCESS_POINT"),
            ]
            db.add_all(devices)
            print(f"Store {store.code} PIN: {store_data['pin']}")
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed()
