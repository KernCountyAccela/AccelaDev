var docModels = documentModelArray.toArray();
for (var i in docModels)
{
    var doc = docModels[i];
    if(matches(doc.getDocCategory(), "Plans","Calcs","Site Plan","Site Plans","Building Plans"))
    {
        doc.setDocStatus("Ready to Route");
        aa.document.updateDocument(doc);
        logDebug("Document Status set to Ready to Route") 
    }
}