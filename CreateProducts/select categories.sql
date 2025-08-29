
SELECT c.id, c.name, lp.LocaleValue as NameEn
FROM Category 
      AS c
      LEFT JOIN LocalizedProperty lp ON c.Id = lp.EntityId AND lp.LocaleKeyGroup = 'Category' AND lp.LanguageId=1
WHERE
     c.SubjectToAcl=0 AND ParentCategoryId=0 AND [Deleted] = 0 AND [Published] = 1
ORDER BY c.DisplayOrder, c.Name