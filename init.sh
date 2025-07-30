docker compose build
docker compose pull
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py populatedb
docker compose run --rm \
  -e DJANGO_SUPERUSER_EMAIL="eric@coteexpert.com" \
  -e DJANGO_SUPERUSER_PASSWORD="af123123123" \
  api python3 manage.py createsuperuser --no-input
docker compose up
