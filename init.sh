docker compose build
docker compose pull
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py populatedb
docker compose run --rm api python3 manage.py createsuperuser
docker compose up
