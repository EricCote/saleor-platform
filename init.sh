

docker compose pull
docker compose run --rm api python3 manage.py migrate
docker compose run --rm api python3 manage.py collectstatic --noinput
#docker compose run --rm api python3 manage.py populatedb

# Create superuser without prompt.
# uses DJANGO_SUPERUSER_EMAIL and DJANGO_SUPERUSER_PASSWORD from backend.env
docker compose run --rm api python3 manage.py createsuperuser --no-input

#Only dev Mode
#docker compose up -d api
#docker compose build storefront
#docker compose run --rm storefront sh -c "HUSKY=0 COREPACK_ENABLE_DOWNLOAD_PROMPT=0 pnpm install"
#docker compose down 

docker compose up -d api
docker compose build --no-cache storefront_prod

docker compose up -d
# or if dev mode:
# docker compose --profile dev up -d


if [[ -v NVM_DIR ]]; then
  echo "NVM is installed.  No need to install node."
else
  # Loads and installs nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/master/install.sh | bash
  #refresh env variables
  source ~/.bashrc

  nvm install --lts
  nvm use --lts
fi

cd jolar/CreateProducts
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
echo 0 > currentProductPos.txt
node generateProductNames.js
node init.js
node attributes.js
node categories.js
node menus.js
node products.js
node syncStocks.js data2.xlsx
node syncStocks.js data3.xlsx
node featured.js

