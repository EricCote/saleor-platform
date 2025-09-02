
docker compose build
docker compose pull
docker compose run --rm api python3 manage.py migrate
#docker compose run --rm api python3 manage.py populatedb
docker compose run --rm api python3 manage.py createsuperuser --no-input
docker compose run --rm storefront sh -c "HUSKY=0 pnpm install"

docker compose up api -d
docker compose build --no-cache storefront_prod
docker compose up -d


if [[ -v NVM_DIR ]]; then
  echo "NVM is installed.  No need to install node."
else
  # Loads and installs nvm
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  #refresh env variables
  source ~/.bashrc

  nvm install --lts
  nvm use --lts
fi

cd CreateProducts
node init.js
node categories.js
node menus.js
node products.js
