from django.contrib import admin
from .models import *

for model in [m for n, m in globals().items() if hasattr(m, '__module__') and m.__module__.endswith('.models')]:
    try:
        admin.site.register(model)
    except admin.sites.AlreadyRegistered:
        pass 