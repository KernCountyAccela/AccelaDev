var recordId = aa.cap.getCapID(aa.env.getValue("recordId")).getOutput();

var recordDocs = aa.document.getCapDocumentList(recordId, lookup("EXTERNAL_DOC_REVIEW","VELOSIMO_ACCELA_USER")).getOutput();
resDocs = []
for (i in recordDocs)
{
    doc = recordDocs[i];
    docEnt = doc.getDocumentEntityAssociationModel();
//aa.print(doc.toString());
//aa.print(doc.getParentSeqNbr());
    rDoc = aa.document.getOriginalDoc(doc).getOutput()
  
    resDoc = {}
    resDoc.allowActions = new String(doc.getAllowActions());
    resDoc.entityType = new String(doc.getEntityType());
    resDoc.source = new String(doc.getSourceName());
    cat = {}
    cat.value = new String(doc.getDocCategory());
    cat.text = new String(doc.getDocCategory());
    resDoc.category = cat
    group = {}
    group.value = new String(doc.getDocGroup());
    group.text = new String(doc.getDocGroup());
    resDoc.group = group;
    status = {}
    status.value = new String(doc.getDocStatus());
    status.text = new String(doc.getDocStatus());
    resDoc.status = status;
    resDoc.department = new String(doc.getDocDepartment());
    resDoc.description = new String(doc.getDocDescription());
    resDoc.fileName = new String(doc.getFileName());
    resDoc.filesize = new String(doc.getFileSize());
    resDoc.entityId = new String(recordId.getID1()+"-"+recordId.getID2()+"-"+recordId.getID3());
    resDoc.id = new String(doc.getDocumentNo());
    resDoc.virtualFolders = new String(doc.getVirtualFolders());
    resDoc.uploadDate = new String(aa.util.formatDate(doc.getFileUpLoadDate(), "MM/dd/yyyy KK:mm a"));
    if(rDoc != null)
    {
       resDoc.prevVersionId = new String(rDoc.getDocumentNo());
    }
    if(doc.getRelatedID() != null)
    {
       resDoc.firstVersionDocId = new String(doc.getRelatedID());
    }
    if(doc.getParentSeqNbr() != null)
    {
       resDoc.parentDocId = new String(doc.getParentSeqNbr());
    }
    resDocs.push(resDoc)
}

aa.env.setValue("documents", JSON.stringify(resDocs));
aa.print(JSON.stringify(resDocs));

function lookup(stdChoice,stdValue) 
    {
    var strControl;
    var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
    
    if (bizDomScriptResult.getSuccess())
        {
        var bizDomScriptObj = bizDomScriptResult.getOutput();
        strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
        logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
        }
    else
        {
        logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
        }
    return strControl;
    }

function logDebug(msg){
  aa.print(msg)
}