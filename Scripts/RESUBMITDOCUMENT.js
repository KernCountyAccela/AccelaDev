docId = aa.env.getValue("docId")
resubmitDocId = aa.env.getValue("resubmitDocId")


var doc = aa.document.getDocumentByPK(docId).getOutput();
var resubmitDoc = aa.document.getDocumentByPK(resubmitDocId).getOutput();

resubmitDoc.setRelatedID(doc.getRelatedID());
resubmitDoc.setParentSeqNbr(java.lang.Long.valueOf(docId));
resubmitDoc.setCategoryByAction("RESUBMIT");
aa.document.updateDocument(resubmitDoc);

doc.setDocStatus("Resubmitted");
doc.setResubmit(false);
aa.document.updateDocument(doc);

jsonRes = {}
jsonRes.status = "Success"
aa.env.setValue("response", JSON.stringify(jsonRes));