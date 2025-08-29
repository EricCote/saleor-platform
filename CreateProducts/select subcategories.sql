
SELECT c.id, c.name, c.ParentCategoryId, lp.LocaleValue as NameEn
FROM [SDVariationsBiz].[dbo].[Category] AS c
  LEFT JOIN Category AS Parent
  ON c.ParentCategoryId = Parent.Id
  LEFT JOIN LocalizedProperty lp ON c.Id = lp.EntityId AND lp.LocaleKeyGroup = 'Category' AND lp.LanguageId=1
WHERE
  c.SubjectToAcl=0 AND parent.SubjectToAcl=0 AND c.ParentCategoryId<>0
  AND c.[Deleted] = 0 AND c.[Published] = 1
  AND parent.[Deleted] = 0 AND parent.[Published] = 1
ORDER BY c.DisplayOrder, c.Name



-------
-- original

SELECT c.id, c.name, c.parentCategoryId, lp.LocaleValue as nameEn
FROM [SDVariationsBiz].[dbo].[Category] AS c
  LEFT JOIN AclRecord AS ar
  ON c.Id = ar.EntityId AND ar.EntityName = 'Category'
  LEFT JOIN Category AS Parent
  ON c.ParentCategoryId = Parent.Id
  LEFT JOIN AclRecord AS arp ON parent.Id = arp.EntityId AND arp.EntityName = 'Category'
  LEFT JOIN LocalizedProperty lp ON c.Id = lp.EntityId AND lp.LocaleKeyGroup = 'Category' AND lp.LanguageId=1
WHERE
  ar.Id IS NULL AND arp.id IS Null AND c.ParentCategoryId<>0
  AND c.[Deleted] = 0 AND c.[Published] = 1
  AND parent.[Deleted] = 0 AND parent.[Published] = 1
ORDER BY c.DisplayOrder, c.Name