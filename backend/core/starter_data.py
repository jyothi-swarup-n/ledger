from .security import now_iso

STARTER_CATEGORIES = [
    {"id": "cat_income", "name": "Income", "type": "Both", "icon": "payments", "isTransfer": False, "subcategories": [
        {"id": "sub_salary", "name": "Primary Salary / Revenue", "individualBudget": 0},
        {"id": "sub_freelance", "name": "Consulting / Freelance", "individualBudget": 0},
        {"id": "sub_investments", "name": "Investments & Interest", "individualBudget": 0},
    ]},
    {"id": "cat_housing", "name": "Housing & Utilities", "type": "Both", "icon": "home", "isTransfer": False, "subcategories": [
        {"id": "sub_rent", "name": "Rent / Mortgage", "individualBudget": 0},
        {"id": "sub_electricity", "name": "Electricity & Water", "individualBudget": 0},
        {"id": "sub_internet", "name": "WiFi & Mobile Postpaid", "individualBudget": 0},
    ]},
    {"id": "cat_groceries", "name": "Groceries & Essentials", "type": "Personal", "icon": "shopping_cart", "isTransfer": False, "subcategories": [
        {"id": "sub_supermarket", "name": "Supermarket & Produce", "individualBudget": 0},
        {"id": "sub_dairy", "name": "Dairy & Daily Needs", "individualBudget": 0},
    ]},
    {"id": "cat_dining", "name": "Dining & Cafes", "type": "Personal", "icon": "restaurant", "isTransfer": False, "subcategories": [
        {"id": "sub_restaurants", "name": "Restaurants & Socials", "individualBudget": 0},
        {"id": "sub_delivery", "name": "Food Delivery", "individualBudget": 0},
    ]},
    {"id": "cat_transport", "name": "Travel & Commute", "type": "Both", "icon": "flight", "isTransfer": False, "subcategories": [
        {"id": "sub_fuel_cabs", "name": "Fuel, Cabs & Transit", "individualBudget": 0},
        {"id": "sub_flights", "name": "Flights & Rail", "individualBudget": 0},
    ]},
    {"id": "cat_software", "name": "Software & Cloud Tools", "type": "Work", "icon": "code", "isTransfer": False, "subcategories": [
        {"id": "sub_cloud", "name": "Hosting & Cloud Servers", "individualBudget": 0},
        {"id": "sub_saas", "name": "SaaS Subscriptions", "individualBudget": 0},
    ]},
    {"id": "cat_business_ops", "name": "Salaries & Operations", "type": "Work", "icon": "briefcase", "isTransfer": False, "subcategories": [
        {"id": "sub_contractors", "name": "Contractors & Freelancers", "individualBudget": 0},
        {"id": "sub_equipment", "name": "Office & Hardware", "individualBudget": 0},
    ]},
    {"id": "cat_savings", "name": "Savings & Investments", "type": "Both", "icon": "account_balance", "isTransfer": False, "subcategories": [
        {"id": "sub_mutual_funds", "name": "Mutual Funds & Stocks", "individualBudget": 0},
        {"id": "sub_emergency", "name": "Emergency Vault", "individualBudget": 0},
    ]},
    {"id": "cat_shopping", "name": "Shopping & Apparel", "type": "Personal", "icon": "shopping_bag", "isTransfer": False, "subcategories": [
        {"id": "sub_lifestyle", "name": "Lifestyle & Electronics", "individualBudget": 0},
    ]},
    {"id": "cat_entertainment", "name": "Entertainment & Media", "type": "Personal", "icon": "movie", "isTransfer": False, "subcategories": [
        {"id": "sub_streaming", "name": "Streaming & Subscriptions", "individualBudget": 0},
    ]},
    {"id": "cat_cc_payment", "name": "Credit Card Payment", "type": "Both", "icon": "credit_card", "isTransfer": True, "subcategories": []},
]


def starter_category_docs(user_id: str) -> list[dict]:
    ts = now_iso()
    return [{**c, "user_id": user_id, "updated_at": ts, "deleted": False} for c in STARTER_CATEGORIES]
