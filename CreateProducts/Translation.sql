SELECT *
FROM Sys.TABLEs
where name like '%loc%'


-- Stats sur les types de traductions
SELECT localekeyGroup, COUNT(*) AS Count
FROM LocalizedProperty AS L
GROUP BY localekeyGroup
ORDER By Count DESC

-- Pour les catégories, 272 names et 26 descriptions
SELECT LocaleKey, COUNT(*) AS Count
FROM LocalizedProperty AS L
  inner join category AS C
  on LocalekeyGroup = 'Category' AND C.Id = L.EntityId
GROUP BY localeKey

--Comparer les traductions Ang (1) et Français (2)
SELECT languageId , Count(*) AS Count
FROM LocalizedProperty AS L
  inner join category AS C
  on LocalekeyGroup = 'Category' AND C.Id = L.EntityId
GROUP BY languageId

-- Comparer la traduction Francaise avec le nom de la catégorie du système
-- 0 incohérences pour les catégories visibles.  (yé)
-- Mais 23 incohérences pour les catégories effacées ou non publiées
SELECT name, localeValue
FROM LocalizedProperty AS L
  inner join category AS C
  on LocalekeyGroup = 'Category' AND C.Id = L.EntityId
WHERE localeKey = 'Name' AND languageId = 2
  AND name<> localeValue
  AND C.Deleted=0
  AND C.Published=1




--Traductions orphelines pour les catégories (0). Yé!
SELECT *
FROM LocalizedProperty AS L
  left join category AS C
  on LocalekeyGroup = 'Category' AND C.Id = L.EntityId
WHERE c.id is null AND LocalekeyGroup = 'Category'

--Traductions orphelines de produits. 
-- 4524 traductions orphelines pour 754 produits effacés 
-- 14457 produits correctement traduits, Donc 5.21% de produits traduits orphelins
SELECT distinct EntityID
FROM LocalizedProperty AS L
  left join Product AS P
  on LocalekeyGroup = 'Product' AND P.Id = L.EntityId
WHERE P.id is  null AND LocalekeyGroup = 'Product'



-- 95 traductions pour les variantes de produits (78 names et 17 descriptions))
SELECT *
FROM LocalizedProperty AS L
WHERE LocalekeyGroup = 'ProductVariant'


-- 65952 traductions pour les produits 
-- Décomposé en:
-- 30422 names, 25317 Full Descriptions 
-- et 10213 Short Descriptions 
SELECT localeKey, COUNT(*) AS Count
FROM LocalizedProperty AS L
WHERE LocalekeyGroup = 'Product'
GROUP By LocaleKey



-- Comparer la traduction Francaise avec le nom du produit du système
-- 10840 noms de produits cohérents "visibles" (yé)
-- mais 62 incohérences pour les produits visibles Pour 0.57% d'incohérence
SELECT p.name, L.LocaleValue
FROM LocalizedProperty AS L
  join Product AS P
  on LocalekeyGroup = 'Product' AND P.Id = L.EntityId
WHERE LanguageId = 2 AND LocaleKey = 'Name'
  AND P.Deleted = 0 AND P.Published = 1
  AND P.Name <> L.LocaleValue
ORDER BY p.id


SELECT *
FROM LocalizedProperty AS L

-- traductions Multiples pour un même produit:
-- Près de 46 instances!
SELECT entityID, LanguageID, LocaleKeyGroup, LocaleKey, COUNT(*) AS Count
FROM LocalizedProperty AS L
GROUP BY entityID,LanguageID,LocaleKeyGroup,LocaleKey
Having Count(*)>1
Order By LocaleKeyGroup

--Voici les exemples de traduction multiple de catégorie
SELECT *
FROM LocalizedProperty AS L
WHERE LocalekeyGroup = 'Category' AND EntityId in (51, 52)

--Voici les exemples de traduction multiple de produit
SELECT *
FROM LocalizedProperty AS L
WHERE LocalekeyGroup = 'Product' AND LocaleKey='fulldescription' AND EntityId in (
  SELECT Distinct(entityID) AS Count
  FROM LocalizedProperty AS L
  WHERE LocaleKeyGroup = 'Product'
  GROUP BY entityID,LanguageID,LocaleKeyGroup,LocaleKey
  Having Count(*)>1
)
Order By EntityID,LanguageID,id

--Voici les exemples de traduction multiple de produit, avec l'id Max
SELECT max(id)
FROM LocalizedProperty AS L
WHERE LocalekeyGroup = 'Product' AND LocaleKey='fulldescription' AND EntityId in (
  SELECT Distinct(entityID) AS Count
  FROM LocalizedProperty AS L
  WHERE LocaleKeyGroup = 'Product'
  GROUP BY entityID,LanguageID,LocaleKeyGroup,LocaleKey
  Having Count(*)>1
)
GROUP BY EntityID,LanguageID
Order By EntityID,LanguageID


SELECT *
FROM LocalizedProperty AS L
Where LocaleValue COLLATE SQL_Latin1_General_CP1_CS_AS like '%á%'

SELECT id, Localevalue
FROM LocalizedProperty AS L
Where id=55836



--Find products with different names and short descriptions
-- Only 431 products with different names and short descriptions, most for sales
SELECT ln.EntityId, LN.LocaleValue AS Name, LD.LocaleValue AS ShortDescription
FROM LocalizedProperty AS LN
  INNER JOIN LocalizedProperty AS LD
  ON Ln.LocaleKey='Name'
    AND LD.LocaleKey='ShortDescription'
    AND Ln.EntityId= LD.EntityId
    AND LN.LanguageId = LD.LanguageId
WHERE ln.LocalekeyGroup = 'Product' AND LD.LocalekeyGroup = 'Product'
  AND LN.LocaleValue <> LD.LocaleValue
Order By EntityId

--Find products with different names and short descriptions, but remove the descritions with sales
-- Only 121 products with different names and short descriptions 
SELECT ln.EntityId, LN.LocaleValue AS Name, LD.LocaleValue AS ShortDescription
FROM LocalizedProperty AS LN
  INNER JOIN LocalizedProperty AS LD
  ON Ln.LocaleKey='Name'
    AND LD.LocaleKey='ShortDescription'
    AND Ln.EntityId= LD.EntityId
    AND LN.LanguageId = LD.LanguageId
WHERE ln.LocalekeyGroup = 'Product' AND LD.LocalekeyGroup = 'Product'
  AND (ld.LocaleValue NOT like '%rompnov%' AND ld.LocaleValue  NOT like 'wowblackfriday%' AND ld.LocaleValue  NOT like '%20OFF')
  AND LN.LocaleValue <> LD.LocaleValue
Order By EntityId




SELECT Pr









SELECT *
FROM LocalizedProperty AS L
WHERE L.LocaleValue like '%&%;%'

--Replace html entities with their corresponding characters
-- First batch - long chain of REPLACE statements

-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--                 REPLACE(
--                     REPLACE(
--                         REPLACE(
--                             REPLACE(
--                                 REPLACE(
--                                     REPLACE(
--                                         REPLACE(
--                                             REPLACE(
--                                                 REPLACE(
--                                                     REPLACE(
--                                                         REPLACE(
--                                                             REPLACE(
--                                                                 REPLACE(
--                                                                     REPLACE(
--                                                                         REPLACE(
--                                                                             REPLACE(
--                                                                                 REPLACE(
--                                                                                     REPLACE(
--                                                                                         REPLACE(
--                                                                                             REPLACE(
--                                                                                                 REPLACE(
--                                                                                                     REPLACE(
--                                                                                                         REPLACE(
--                                                                                                             REPLACE(
--                                                                                                                 REPLACE(
--                                                                                                                     REPLACE(
--                                                                                                                         REPLACE(
--                                                                                                                             REPLACE(
--                                                                                                                                 REPLACE(
--                                                                                                                                     REPLACE(
--                                                                                                                                         REPLACE(
--                                                                                                                                             LocaleValue,
--     '&quot;', '"'
--     ),
--     '&apos;', ''''
--     ),
--     '&agrave;' COLLATE SQL_Latin1_General_CP1_CS_AS, 'à'
--     ),
--     '&eacute;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'é'
--     ),
--     '&egrave;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'è'
--     ),
--     '&ccedil;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ç'
--     ),
--     '&Agrave;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'À'
--     ),
--     '&Eacute;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'É'
--     ),
--     '&Egrave;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'È'
--     ),
--     '&Ccedil;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ç'
--     ),
--     '&acirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'â'
--     ),
--     '&ecirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ê'
--     ),
--     '&icirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'î'
--     ),
--     '&ocirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ô'
--     ),
--     '&ucirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'û'
--     ),
--     '&ugrave;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ù'
--     ),
--     '&Acirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Â'
--     ),
--     '&Ecirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ê'
--     ),
--     '&Icirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Î'
--     ),
--     '&Ocirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ô'
--     ),
--     '&Ucirc;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Û'
--     ),
--     '&Ugrave;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ù'
--     ),
--     '&auml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ä'
--     ),
--     '&euml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ë'
--     ),
--     '&iuml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ï'
--     ),
--     '&ouml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ö'
--     ),
--     '&uuml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'ü'
--     ),
--     '&Auml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ä'
--     ),
--     '&Euml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ë'
--     ),
--     '&Iuml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ï'
--     ),
--     '&Ouml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ö'
--     ),
--     '&Uuml;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Ü'
--     ),
--     '&rsquo;', '’'
--     ),
--     '&frac12;', '½'
--     ),
--     '&frac14;', '¼'
--     ),
--     '&frac18;', '⅛'
-- );



-- Second batch - shorter chains of REPLACE statements


-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&rdquo;', '”'
--     ),
--     '&reg;', '®'
--     ),
--     '&ldquo;', '“'),
--     '&laquo;','«'),
--      '&raquo;','»')



-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&hellip;', '…'
--     ),
--     '&ndash;', ''
--     ),
--     '&mdash;', '—'),
--     '&bull;','•'),
--      '&trade;','™')


-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&oelig;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'œ'
--     ),
--     '&OElig;'  COLLATE SQL_Latin1_General_CP1_CS_AS, 'Œ'
--     ),
--     '&frac34;', '¾'),
--     '&lsquo;','‘'),
--      '&rsquo;','’')


-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&middot;', '·'
--     ),
--     '&ordf;', 'ª'
--     ),
--     '&ordm;', 'º'),
--     '&deg;','°'),
--      '&Prime;','″')

-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&copy;', '©'
--     ),
--     '&thinsp;', ''
--     ),
--     '&igrave;', 'ì'),
--     '&euro;',''),
--      '&shy; ','')


-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&times;', '×'
--     ),
--     '&nbsp;', ' '
--     ),
--     '&sbquo;', '‚'),
--     '&aacute;','á'),
--      '&shy;','')



-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&acute;', '´'
--     ),
--     '&emsp;', ' '
--     ),
--     '&zwj;', ''),
--     '&iexcl;','!'),
--      '',' ')


-- UPDATE LocalizedProperty
-- SET LocaleValue = REPLACE(
--         REPLACE(   
--           REPLACE(
--             REPLACE(
--               REPLACE(
--    LocaleValue,
--     '&bdquo;', '„'
--     ),
--     '&Oslash;', ''
--     ),
--     '&rlm;', ''),
--     '&scaron;',''),
--      '&cedil;',' ')



SELECT L.id, L.localevalue, L.LocaleKeyGroup, p.name, p.id
FROM LocalizedProperty as L

  LEFT Join Product AS P ON l.entityId=p.id
  LEft join ProductVariant AS PV on p.id=pv.ProductId
WHERE localevalue like '%async=%'
order by l.id

--Sheets-value

DELETE LocalizedProperty
WHERE id in(18810,17772,17768)






UPDATE LocalizedProperty
SET LocaleValue = REPLACE(
   LocaleValue,
    'async=""', 'async="1"'
    )
    WHERE  localevalue like '%async=""%'




DELETE LocalizedProperty
WHERE ID IN (

  SELECT max(id)
FROM LocalizedProperty AS L
WHERE LocalekeyGroup = 'Product' AND LocaleKey='fulldescription' AND EntityId in (
  SELECT Distinct(entityID) AS Count
  FROM LocalizedProperty AS L
  WHERE LocaleKeyGroup = 'Product'
  GROUP BY entityID,LanguageID,LocaleKeyGroup,LocaleKey
  Having Count(*)>1
)
GROUP BY EntityID,LanguageID

)