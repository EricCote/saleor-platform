# Importer les données de SD Variations

Il faut créer un fichier .env ou des variables d'environnement:

- `sqlconn_string` pour se connecter sur la BD NOP Commerce de SD Variations
- `EMAIL` et `PASSWORD` pour se logguer sur l'API Saleor

On roule les scripts dans l'ordre:

`init.js` : Initialise la bd
`categories.js`: importe les catégories et les collections
`menus.js`: importe les menus (navigation et de pied de page)
`products.js`: importe les produits
`featured.js`: importe les "featured products" pour la page d'accueil (20 dernières nouveautés)
