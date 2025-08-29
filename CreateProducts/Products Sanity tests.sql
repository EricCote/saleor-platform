
-- (gros travail) with aggregate,  filters the "subjectToAcl" column instead of looking at acl

SELECT innerTable.*,
  STRING_AGG(   FORMAT(pic.id, '0000000') + '_' + pic.SeoFilename  + '.' + (case pic.mimetype WHEN 'image/png' THEN 'png' WHEN 'image/gif' THEN 'gif' ELSE 'jpg' END) ,', ') WITHIN GROUP (ORDER BY m2.productid, m2.displayOrder) AS pictures
FROM
  (
SELECT
    p.id  AS productID,
    p.name AS productName,
    lne.LocaleValue AS nameEn,
    lde.LocaleValue AS descriptionEn,
    lnf.LocaleValue AS nameFr,
    ldf.LocaleValue AS descriptionFr,
    pv.sku, pv.stockquantity, pv.id AS pvId, pv.price, pv.productCost, pv.upc, pv.name AS variantName,
    STRING_AGG(m.CategoryId  ,', ') WITHIN GROUP (ORDER BY m.displayOrder ASC) AS categoryIds

  FROM SDVariationsBiz.dbo.Product AS P
    LEFT JOIN SDVariationsBiz.dbo.Product_Category_Mapping AS M ON M.ProductId = P.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS C ON M.CategoryId = C.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS CP ON C.ParentCategoryId = CP.Id
    LEFT JOIN SDVariationsBiz.dbo.ProductVariant AS PV ON P.Id = PV.ProductId
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lne ON p.Id = lne.EntityId AND lne.LocaleKeyGroup = 'Product' AND lne.LocaleKey='Name' AND lne.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lde ON p.Id = lde.EntityId AND lde.LocaleKeyGroup = 'Product' AND lde.LocaleKey='FullDescription' AND lde.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lnf ON p.Id = lnf.EntityId AND lnf.LocaleKeyGroup = 'Product' AND lnf.LocaleKey='Name' AND lnf.LanguageId=2
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS ldf ON p.Id = ldf.EntityId AND ldf.LocaleKeyGroup = 'Product' AND ldf.LocaleKey='FullDescription' AND ldf.LanguageId=2
  WHERE
     (c.subjectToAcl = 0 or c.SubjectToAcl is null)
    AND (cp.subjectToAcl = 0 or cp.SubjectToAcl is null)
    AND p.subjectToAcl  = 0
    AND (CP.published = 1 OR CP.published is null)
    AND (CP.deleted = 0 OR CP.deleted IS NULL)
    AND (C.published = 1 OR C.published is null)
    AND (C.deleted = 0 OR C.deleted IS NULL)
    AND pv.published = 1
    AND pv.deleted = 0
    AND p.published = 1
    AND p.deleted = 0
    AND pv.price>0
    AND p.id not in (
    SELECT p2.id
    FROM SDVariationsBiz.dbo.Product AS P2
      JOIN SDVariationsBiz.dbo.Product_Category_Mapping M2 ON p2.id=m2.ProductId
    WHERE m2.CategoryId=48
  )

  GROUP BY p.id, p.name, lne.LocaleValue, lde.LocaleValue, lnf.LocaleValue, ldf.LocaleValue,   pv.sku, pv.stockquantity, pv.id, pv.price, pv.productCost, pv.upc,pv.name
) AS innerTable
  LEFT JOIN SDVariationsBiz.dbo.Product_Picture_Mapping AS M2 ON M2.ProductId = innerTable.ProductId
  LEFT JOIN SDVariationsBiz.dbo.Picture AS Pic ON Pic.Id = M2.PictureId
GROUP BY
    innerTable.ProductID,innerTable.ProductName, innerTable.NameEn,innerTable.DescriptionEn,innerTable.NameFr,innerTable.DescriptionFr,   innerTable.sku, innerTable.stockquantity, innerTable.pvId, innerTable.price, innerTable.productCost, innerTable.upc, innerTable.VariantName, innerTable.CategoryIds
ORDER BY innerTable.ProductId



----



-- (gros travail) with aggregate,  looking for "subjectToAcl" column but no ACL


USE tempdb

SELECT innerTable.*,
  STRING_AGG(   FORMAT(pic.id, '0000000') + '_' + pic.SeoFilename  + '.' + (case pic.mimetype WHEN 'image/png' THEN 'png' WHEN 'image/gif' THEN 'gif' ELSE 'jpg' END) ,', ') WITHIN GROUP (ORDER BY m2.productid, m2.displayOrder) AS pictures
FROM
  (
SELECT
    p.id  AS productID,
    p.name AS productName,
    lne.LocaleValue AS nameEn,
    lde.LocaleValue AS descriptionEn,
    lnf.LocaleValue AS nameFr,
    ldf.LocaleValue AS descriptionFr,
    pv.sku, pv.stockquantity, pv.id AS pvId, pv.price, pv.productCost, pv.upc, pv.name AS variantName,
    STRING_AGG(m.CategoryId  ,', ') WITHIN GROUP (ORDER BY m.displayOrder ASC) AS categoryIds

  FROM SDVariationsBiz.dbo.Product AS P
    LEFT JOIN SDVariationsBiz.dbo.Product_Category_Mapping AS M ON M.ProductId = P.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS C ON M.CategoryId = C.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS CP ON C.ParentCategoryId = CP.Id
    LEFT JOIN SDVariationsBiz.dbo.ProductVariant AS PV ON P.Id = PV.ProductId
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lne ON p.Id = lne.EntityId AND lne.LocaleKeyGroup = 'Product' AND lne.LocaleKey='Name' AND lne.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lde ON p.Id = lde.EntityId AND lde.LocaleKeyGroup = 'Product' AND lde.LocaleKey='FullDescription' AND lde.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lnf ON p.Id = lnf.EntityId AND lnf.LocaleKeyGroup = 'Product' AND lnf.LocaleKey='Name' AND lnf.LanguageId=2
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS ldf ON p.Id = ldf.EntityId AND ldf.LocaleKeyGroup = 'Product' AND ldf.LocaleKey='FullDescription' AND ldf.LanguageId=2
  WHERE
    aclc.Id IS  NULL
    AND aclcp.id IS  NULL
    AND aclp.id IS  NULL
    -- AND p.SubjectToAcl=1
    AND cp.SubjectToAcl=1
    AND (CP.published = 1 OR CP.published is null)
    AND (CP.deleted = 0 OR CP.deleted IS NULL)
    AND (C.published = 1 OR C.published is null)
    AND (C.deleted = 0 OR C.deleted IS NULL)
    AND pv.published = 1
    AND pv.deleted = 0
    AND p.published = 1
    AND p.deleted = 0
    AND p.id not in (
    SELECT p2.id
    FROM SDVariationsBiz.dbo.Product AS P2
      JOIN SDVariationsBiz.dbo.Product_Category_Mapping M2 ON p2.id=m2.ProductId
    WHERE m2.CategoryId=48
  )


  GROUP BY p.id, p.name, lne.LocaleValue, lde.LocaleValue, lnf.LocaleValue, ldf.LocaleValue,   pv.sku, pv.stockquantity, pv.id, pv.price, pv.productCost, pv.upc,pv.name
) AS innerTable
  LEFT JOIN SDVariationsBiz.dbo.Product_Picture_Mapping AS M2 ON M2.ProductId = innerTable.ProductId
  LEFT JOIN SDVariationsBiz.dbo.Picture AS Pic ON Pic.Id = M2.PictureId
GROUP BY
    innerTable.ProductID,innerTable.ProductName, innerTable.NameEn,innerTable.DescriptionEn,innerTable.NameFr,innerTable.DescriptionFr,   innerTable.sku, innerTable.stockquantity, innerTable.pvId, innerTable.price, innerTable.productCost, innerTable.upc, innerTable.VariantName, innerTable.CategoryIds
ORDER BY innerTable.ProductId

USE [SDVariationsBiz]

----






-- (gros travail) with aggregate,  looking for an an acl but a false "subjectToAcl" column
-- 28 products That should not be there (now added)

USE tempdb

SELECT innerTable.*,
  STRING_AGG(   FORMAT(pic.id, '0000000') + '_' + pic.SeoFilename  + '.' + (case pic.mimetype WHEN 'image/png' THEN 'png' WHEN 'image/gif' THEN 'gif' ELSE 'jpg' END) ,', ') WITHIN GROUP (ORDER BY m2.productid, m2.displayOrder) AS pictures
FROM
  (
SELECT
    p.id  AS productID,
    p.name AS productName,
    lne.LocaleValue AS nameEn,
    lde.LocaleValue AS descriptionEn,
    lnf.LocaleValue AS nameFr,
    ldf.LocaleValue AS descriptionFr,
    pv.sku, pv.stockquantity, pv.id AS pvId, pv.price, pv.productCost, pv.upc, pv.name AS variantName,
    STRING_AGG(m.CategoryId  ,', ') WITHIN GROUP (ORDER BY m.displayOrder ASC) AS categoryIds

  FROM SDVariationsBiz.dbo.Product AS P
    LEFT JOIN SDVariationsBiz.dbo.Product_Category_Mapping AS M ON M.ProductId = P.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS C ON M.CategoryId = C.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS CP ON C.ParentCategoryId = CP.Id
    LEFT JOIN SDVariationsBiz.dbo.ProductVariant AS PV ON P.Id = PV.ProductId
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lne ON p.Id = lne.EntityId AND lne.LocaleKeyGroup = 'Product' AND lne.LocaleKey='Name' AND lne.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lde ON p.Id = lde.EntityId AND lde.LocaleKeyGroup = 'Product' AND lde.LocaleKey='FullDescription' AND lde.LanguageId=1
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS lnf ON p.Id = lnf.EntityId AND lnf.LocaleKeyGroup = 'Product' AND lnf.LocaleKey='Name' AND lnf.LanguageId=2
    LEFT JOIN SDVariationsBiz.dbo.LocalizedProperty AS ldf ON p.Id = ldf.EntityId AND ldf.LocaleKeyGroup = 'Product' AND ldf.LocaleKey='FullDescription' AND ldf.LanguageId=2
  WHERE
    aclc.Id IS  NULL
    AND aclcp.id IS  NULL
    AND aclp.id IS  NOT NULL
    AND p.SubjectToAcl=0
    AND (CP.published = 1 OR CP.published is null)
    AND (CP.deleted = 0 OR CP.deleted IS NULL)
    AND (C.published = 1 OR C.published is null)
    AND (C.deleted = 0 OR C.deleted IS NULL)
    AND pv.published = 1
    AND pv.deleted = 0
    AND p.published = 1
    AND p.deleted = 0
    AND p.id not in (
    SELECT p2.id
    FROM SDVariationsBiz.dbo.Product AS P2
      JOIN SDVariationsBiz.dbo.Product_Category_Mapping M2 ON p2.id=m2.ProductId
    WHERE m2.CategoryId=48
  )


  GROUP BY p.id, p.name, lne.LocaleValue, lde.LocaleValue, lnf.LocaleValue, ldf.LocaleValue,   pv.sku, pv.stockquantity, pv.id, pv.price, pv.productCost, pv.upc,pv.name
) AS innerTable
  LEFT JOIN SDVariationsBiz.dbo.Product_Picture_Mapping AS M2 ON M2.ProductId = innerTable.ProductId
  LEFT JOIN SDVariationsBiz.dbo.Picture AS Pic ON Pic.Id = M2.PictureId
GROUP BY
    innerTable.ProductID,innerTable.ProductName, innerTable.NameEn,innerTable.DescriptionEn,innerTable.NameFr,innerTable.DescriptionFr,   innerTable.sku, innerTable.stockquantity, innerTable.pvId, innerTable.price, innerTable.productCost, innerTable.upc, innerTable.VariantName, innerTable.CategoryIds
ORDER BY innerTable.ProductId

USE [SDVariationsBiz]

-----------------------

USE [SDVariationsBiz]

--check nb categories
select count(*) AS Count, productId
from Product_Category_Mapping
--where ProductId = 20169
GROUP BY ProductId
ORDER BY Count DESC


-- Catégories pour produit spécifique
SELECT cp.name AS Parent, c.name AS Category, c.id as catid, m.DisplayOrder, p.name AS product
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE
--  c.id=48
   aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and (CP.published = 1 OR CP.published is null)
  and (CP.deleted = 0 OR CP.deleted IS NULL)
  and (C.published = 1 OR C.published is null)
  and (C.deleted = 0 OR C.deleted IS NULL)
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0



-- List products with main category (gros travail)
SELECT cp.id as ParentID, cp.name AS Parent, c.id AS CatID, c.name AS Category, m.DisplayOrder, p.id  AS ProductID, p.name AS ProductName
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE
--  p.id=3628 AND
  (m.id=(   
  SELECT TOP 1
    m2.id
  FROM Product_Category_Mapping AS M2
    LEFT JOIN Category AS C2
    ON M2.CategoryId = C2.Id
    LEFT JOIN Category AS CP2
    ON C2.ParentCategoryId = CP2.Id
    LEFT JOIN AclRecord AS aclc2
    ON aclc2.EntityId = c2.id AND aclc2.EntityName='Category'
    LEFT JOIN AclRecord AS aclcp2
    ON aclcp2.EntityId = cp2.id AND aclcp2.EntityName='Category'
  WHERE m2.ProductId=p.id
    AND aclc2.Id IS NULL
    AND aclcp2.id IS NULL
    AND (CP2.published = 1 OR CP2.published is null)
    AND (CP2.deleted = 0 OR CP2.deleted IS NULL)
    AND (C2.published = 1 OR C2.published is null)
    AND (C2.deleted = 0 OR C2.deleted IS NULL)
  ORDER BY m2.DisplayOrder,m2.Id
  )
  or m.DisplayOrder is NULL)
  AND aclc.Id IS NULL
  AND aclcp.id IS  NULL
  AND aclp.id IS  NULL
  AND (CP.published = 1 OR CP.published is null)
  AND (CP.deleted = 0 OR CP.deleted IS NULL)
  AND (C.published = 1 OR C.published is null)
  AND (C.deleted = 0 OR C.deleted IS NULL)
  AND pv.published = 1
  AND pv.deleted = 0
  AND p.published = 1
  AND p.deleted = 0
  AND p.id not in (
    SELECT p2.id
  FROM Product AS P2 JOIN Product_Category_Mapping M2 ON p2.id=m2.ProductId
  WHERE m2.CategoryId=48
  )
ORDER BY p.id

SELECT @@VERSION;

SELECT NAME, COMPATIBILITY_LEVEL
FROM sys.databases
ORDER BY compatibility_level;

USE [SDVariationsBiz]
USE tempdb
go

-- (gros travail) with aggregate

SELECT innerTable.*,
  STRING_AGG(   FORMAT(pic.id, '0000000') + '_' + pic.SeoFilename  + '.' + (case pic.mimetype WHEN 'image/png' THEN 'png' WHEN 'image/gif' THEN 'gif' ELSE 'jpg' END) ,', ') WITHIN GROUP (ORDER BY m2.productid, m2.displayOrder) AS pictures
FROM
  (
SELECT
    p.id  AS ProductID,
    p.name AS ProductName,
    pv.sku, pv.stockquantity, pv.id AS pvId, pv.price, pv.productCost, pv.upc, pv.name AS VariantName,
    STRING_AGG(m.CategoryId  ,', ') WITHIN GROUP (ORDER BY m.displayOrder ASC) AS CategoryIds

  FROM SDVariationsBiz.dbo.Product AS P
    LEFT JOIN SDVariationsBiz.dbo.Product_Category_Mapping AS M ON M.ProductId = P.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS C ON M.CategoryId = C.Id
    LEFT JOIN SDVariationsBiz.dbo.Category AS CP ON C.ParentCategoryId = CP.Id
    LEFT JOIN SDVariationsBiz.dbo.ProductVariant AS PV ON P.Id = PV.ProductId
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
    LEFT JOIN SDVariationsBiz.dbo.AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'

  WHERE
 
   aclc.Id IS  NULL
    AND aclcp.id IS  NULL
    AND aclp.id IS  NULL
    AND (CP.published = 1 OR CP.published is null)
    AND (CP.deleted = 0 OR CP.deleted IS NULL)
    AND (C.published = 1 OR C.published is null)
    AND (C.deleted = 0 OR C.deleted IS NULL)
    AND pv.published = 1
    AND pv.deleted = 0
    AND p.published = 1
    AND p.deleted = 0
    AND p.id not in (
    SELECT p2.id
    FROM SDVariationsBiz.dbo.Product AS P2
      JOIN SDVariationsBiz.dbo.Product_Category_Mapping M2 ON p2.id=m2.ProductId
    WHERE m2.CategoryId=48
  )
    AND p.id not in (10336, 19222, 19224,17489)

  GROUP BY p.id, p.name,pv.sku, pv.stockquantity, pv.id, pv.price, pv.productCost, pv.upc,pv.name
) AS innerTable
  LEFT JOIN SDVariationsBiz.dbo.Product_Picture_Mapping AS M2 ON M2.ProductId = innerTable.ProductId
  LEFT JOIN SDVariationsBiz.dbo.Picture AS Pic ON Pic.Id = M2.PictureId
GROUP BY
    innerTable.ProductID,innerTable.ProductName,innerTable.sku, innerTable.stockquantity, innerTable.pvId, innerTable.price, innerTable.productCost, innerTable.upc, innerTable.VariantName, innerTable.CategoryIds
ORDER BY innerTable.ProductId


USE [SDVariationsBiz]


--
select m1.*
from Product_Category_Mapping m1
  inner join Product_Category_Mapping m2 ON m1.ProductId=m2.ProductId AND m1.DisplayOrder=m2.DisplayOrder AND m1.id<>m2.id
where  m1.displayOrder<>0 and m1.DisplayOrder<>9999
ORDER BY ProductID

--Liste des produits et leur categories
SELECT cp.name AS Parent, c.name AS Category, p.id, p.name AS product
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE
   aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and (CP.published = 1 OR CP.published is null)
  and (CP.deleted = 0 OR CP.deleted IS NULL)
  and (C.published = 1 OR C.published is null)
  and (C.deleted = 0 OR C.deleted IS NULL)
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0
ORDER BY p.id


select pv.sku, pv.stockquantity, pv.id AS pvId, pv.price, pv.productCost, pv.upc, pv.name AS VariantName
from ProductVariant as pv


-- products with no categories  (2)
SELECT p.Id AS ProductId,
  p.Name AS ProductName,
  p.*,
  c.Id AS CategoryId,
  c.Name AS CategoryName,
  cp.Id AS ParentCategoryId,
  cp.Name AS ParentCategoryName,
  pv.Id AS VariantId,
  pv.Name AS VariantName,
  pv.Sku
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
WHERE c.Id IS NULL
  AND pv.Published = 1
  AND pv.Deleted = 0
  AND p.Published = 1
  AND p.Deleted = 0



-- Stats Multicategories
SELECT p.Id AS ProductId,
  p.Name AS ProductName,
  pv.sku AS Sku,
  count(c.id) as CategoryCount
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE 
  aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and (CP.published = 1 OR CP.published is null)
  and (CP.deleted = 0 OR CP.deleted IS NULL)
  and (C.published = 1 OR C.published is null)
  and (C.deleted = 0 OR C.deleted IS NULL)
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0
  AND p.id not in (
    SELECT p2.id
  from Product AS P2 JOIN Product_Category_Mapping M2 ON p2.id=m2.ProductId
  where m2.CategoryId=48)
GROUP BY p.id, p.name, pv.sku
ORDER BY CategoryCount DESC



--Produits ayant une categorie non-publiée ou effacée
SELECT p.Id AS ProductId,
  p.Name AS ProductName,
  c.Name, c.Published, c.Deleted, cp.name
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE 
  aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and (C.published = 0 OR C.deleted = 1 )
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0



--Produits ayant une categorie 24
SELECT p.Id AS ProductId,
  p.Name AS ProductName,
  c.Name, c.Published, c.Deleted, cp.name
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE 
  aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and c.id=24
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0


--Produits ayant une categorie Primaire
SELECT p.Id AS ProductId,
  p.Name AS ProductName,
  c.Name, c.Published, c.Deleted, cp.name
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE 
  aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and cp.id IS NULL
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0



--Stats Produits ayant une categorie Primaire
SELECT Count(*), c.name

FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
  LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
  LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
WHERE 
  aclc.Id is NULL
  AND aclcp.id IS NULL
  and aclp.id Is NULL
  and cp.id IS NULL
  and pv.published = 1
  and pv.deleted = 0
  and p.published = 1
  and p.deleted = 0
GROUP BY c.Name;



--Stats de Stats
SELECT
  CategoryCount as nbCategories,
  COUNT(ProductId)
FROM (SELECT p.Id AS ProductId,
    p.Name AS ProductName,
    count(c.id) as CategoryCount
  FROM Product AS P
    LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
    LEFT JOIN Category AS C ON M.CategoryId = C.Id
    LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
    LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
    LEFT JOIN AclRecord AS aclc ON aclc.EntityId = c.id AND aclc.EntityName='Category'
    LEFT JOIN AclRecord AS aclcp ON aclcp.EntityId = cp.id AND aclcp.EntityName='Category'
    LEFT JOIN AclRecord AS aclp ON aclp.EntityId = p.id AND aclp.EntityName='Product'
  WHERE 
  aclc.Id is NULL
    AND aclcp.id IS NULL
    and aclp.id Is NULL
    and (CP.published = 1 OR CP.published IS NULL)
    and (CP.deleted = 0 OR CP.deleted IS NULL)
    and (C.published = 1 OR C.published IS NULL)
    and (C.deleted = 0 OR C.deleted IS NULL)
    and pv.published = 1
    and pv.deleted = 0
    and p.published = 1
    and p.deleted = 0
    AND p.id not in (
      SELECT p2.id
    from Product AS P2 JOIN Product_Category_Mapping M2 ON p2.id=m2.ProductId
    where m2.CategoryId=48)

  GROUP BY p.id, p.name
) AS Src
GROUP By CategoryCount
ORDER BY nbCategories




-- products with no variants (none)
SELECT p.Id AS ProductId,
  p.Name AS ProductName,
  p.*,
  c.Id AS CategoryId,
  c.Name AS CategoryName,
  cp.Id AS ParentCategoryId,
  cp.Name AS ParentCategoryName,
  pv.Id AS VariantId,
  pv.Name AS VariantName
FROM Product AS P
  LEFT JOIN Product_Category_Mapping AS M ON M.ProductId = P.Id
  LEFT JOIN Category AS C ON M.CategoryId = C.Id
  LEFT JOIN Category AS CP ON C.ParentCategoryId = CP.Id
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
WHERE pv.Id IS NULL


-- products with multiple variants (none)
SELECT p.id as id, p.Name AS ProductName, count(pv.Id) AS VariantCount
FROM Product AS P
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
WHERE p.Id IS NOT NULL
  AND pv.Published = 1
  AND pv.Deleted = 0
  AND p.Published = 1
  AND p.Deleted = 0
GROUP BY p.id, p.Name
having count(pv.Id) > 1
ORDER BY VariantCount DESC


-- products Stats
SELECT VariantCount AS Nb_of_variants, count(src.productName) AS total_products
FROM (  
SELECT p.id AS ID, p.Name AS ProductName, count(pv.Id) AS VariantCount
  FROM Product AS P
    LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
  WHERE p.Id IS NOT NULL
    AND pv.Published = 1
    AND pv.Deleted = 0
    AND p.Published = 1
    AND p.Deleted = 0
  GROUP BY p.id, p.Name
) AS src
GROUP BY VariantCount
ORDER BY VariantCount ASC


-- products with identical names
SELECT p1.id, p2.id, p1.Name, pv1.Sku, pv2.sku
from Product AS P1
  LEFT JOIN Product AS P2 ON lower(P1.Name) = lower(P2.Name)
  join ProductVariant AS PV1 ON P1.Id = PV1.ProductId
  join ProductVariant AS PV2 ON P2.Id = PV2.ProductId
WHERE P1.Id < P2.Id
  AND P1.Published = 1
  AND P1.Deleted = 0
  AND P2.Published = 1
  AND P2.Deleted = 0
  And PV1.Published = 1
  AND PV1.Deleted = 0
  And PV2.Published = 1
  AND PV2.Deleted = 0

--Products with identical names to discontinued products
SELECT p1.id, p2.id, p1.Name
from Product AS P1
  LEFT JOIN Product AS P2 ON lower(P1.Name) = lower(P2.Name)
  JOIN ProductVariant AS PV1 ON P1.Id = PV1.ProductId
  JOIN ProductVariant AS PV2 ON P2.Id = PV2.ProductId
WHERE P1.Id < P2.Id
ORDER BY Name, p1.id, p2.id



--No of Products with variants that are published and not deleted
SELECT COUNT(p.id)
FROM Product AS P
  LEFT JOIN ProductVariant AS PV ON P.Id = PV.ProductId
WHERE
     pv.Published = 1
  AND pv.Deleted = 0
  AND p.Published = 1
  AND p.Deleted = 0

-- products with no variants (none)
SELECT *
FROM Product AS P
  LEFT JOIN ProductVariant AS PV
  ON PV.ProductId = P.Id
WHERE  p.id is null


--products with identical names
SELECT p2.id, *
FROM Product AS P1
  JOIN product AS P2
  ON P1.Id < P2.id AND lower(p1.name)=lower(p2.name)
  join ProductVariant AS pv1
  ON p1.id = pv1.ProductId
  join ProductVariant AS pv2
  ON p2.id = pv2.ProductId
WHERE 
  p1.Deleted=0
  AND p2.Deleted=0
  AND p1.Published=1
  AND p2.Published=1
  AND pv1.Deleted=0
  AND pv2.Deleted=0
  AND pv1.Published=1
  AND pv2.Published=1




-- variants with no products (none)
SELECT *
FROM ProductVariant AS PV
  LEFT JOIN Product AS P
  ON PV.ProductId = P.Id
WHERE  p.id is null



SELECT sku, count(*) as count
from ProductVariant
group by Sku
order by count desc

select count(*)
from ProductVariant

select count(*)
from Product


SELECT count(*)
from Category




SELECT c.*
FROM [SDVariationsBiz].[dbo].[Category] AS c
  LEFT JOIN
  AclRecord AS ar ON c.Id = ar.EntityId AND ar.EntityName = 'Category'
  LEFT JOIN
  Category AS Parent ON c.ParentCategoryId = Parent.Id
  LEFT JOIN
  AclRecord AS arp ON parent.Id = arp.EntityId AND arp.EntityName = 'Category'
-- neither parent nor subcategory should have an ACL record
WHERE
        ar.Id IS NULL AND arp.id IS Null AND c.ParentCategoryId=3
  AND c.[Deleted] = 0 AND c.[Published] = 1
  AND parent.[Deleted] = 0 AND parent.[Published] = 1
ORDER BY c.DisplayOrder, c.Name


