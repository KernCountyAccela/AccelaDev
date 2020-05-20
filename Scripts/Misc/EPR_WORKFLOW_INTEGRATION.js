if (matches(currentUserID,"GRASTYJ", "KTRUJILLO","VELOSIMO"))
{
    showDebug = true; showMessage= true;
}


if(appMatch("Building/Kern Commercial/New/NA")|| appMatch("Building/Kern Commercial/Abatement/NA")|| appMatch("Building/Kern Commercial/Accessory/Dairy")|| appMatch("Building/Kern Commercial/Accessory/NA")|| appMatch("Building/Kern Commercial/Alteration/Change Occupancy")|| appMatch("Building/Kern Commercial/Alteration/NA")|| appMatch("Building/Kern Commercial/Demolition/NA")|| appMatch("Building/Kern Commercial/Electrical/NA")|| appMatch("Building/Kern Commercial/Electrical/Pump")|| appMatch("Building/Kern Commercial/Energy/Solar")|| appMatch("Building/Kern Commercial/Energy/Wind")|| appMatch("Building/Kern Commercial/Fire/Call Out")|| appMatch("Building/Kern Commercial/Flood Survey/NA")|| appMatch("Building/Kern Commercial/Grading/Designer Certified")
|| appMatch("Building/Kern Commercial/Grading/Engineered")|| appMatch("Building/Kern Commercial/Grading/NA")|| appMatch("Building/Kern Commercial/Landscape/New")|| appMatch("Building/Kern Commercial/Landscape/Retrofit")|| appMatch("Building/Kern Commercial/Mechanical/NA")|| appMatch("Building/Kern Commercial/Miscellaneous/NA")|| appMatch("Building/Kern Commercial/New/MFD")|| appMatch("Building/Kern Commercial/New/NA")|| appMatch("Building/Kern Commercial/Plumbing/NA")|| appMatch("Building/Kern Commercial/Pool/NA")|| appMatch("Building/Kern Commercial/Roof/NA")|| appMatch("Building/Kern Commercial/Sign/NA")|| appMatch("Building/Kern Commercial/Tracking/NA")|| appMatch("Building/Kern Commercial/URM/NA")|| appMatch("Building/Kern Residential/Abatement/NA")|| appMatch("Building/Kern Residential/Accessory/NA")|| appMatch("Building/Kern Residential/Alteration/Change Occupancy")|| appMatch("Building/Kern Residential/Alteration/Garage")|| appMatch("Building/Kern Residential/Alteration/NA")|| appMatch("Building/Kern Residential/Demolition/NA")|| appMatch("Building/Kern Residential/Electrical/NA")|| appMatch("Building/Kern Residential/Electrical/Pump")|| appMatch("Building/Kern Residential/Energy/Solar")|| appMatch("Building/Kern Residential/Energy/Wind")|| appMatch("Building/Kern Residential/Fire/Call Out")|| appMatch("Building/Kern Residential/Fire Survey/NA")|| appMatch("Building/Kern Residential/Flood Survey/NA")|| appMatch("Building/Kern Residential/Grading/Designer Certified")|| appMatch("Building/Kern Residential/Grading/Engineered")|| appMatch("Building/Kern Residential/Grading/NA")|| appMatch("Building/Kern Residential/Landscape/New")|| appMatch("Building/Kern Residential/Landscape/Retrofit")|| appMatch("Building/Kern Residential/Mechanical/NA")|| appMatch("Building/Kern Residential/Miscellaneous/NA")|| appMatch("Building/Kern Residential/Mobile Home/NA")|| appMatch("Building/Kern Residential/Move/NA")|| appMatch("Building/Kern Residential/Move/SFD")	|| appMatch("Building/Kern Residential/Move Survey/NA")|| appMatch("Building/Kern Residential/New/MFD")|| appMatch("Building/Kern Residential/New/SFD")|| appMatch("Building/Kern Residential/Plumbing/NA")|| appMatch("Building/Kern Residential/Pool/NA")
|| appMatch("Building/Kern Residential/Qualify Survey/NA")|| appMatch("Building/Kern Residential/Roof/NA")|| appMatch("Building/Kern Residential/Tracking/NA")|| appMatch("Building/Kern Residential/URM/NA") || appMatch("Building/Kern/Standard Plans/NA"))

{
	if((wfTask == "Application Intake" || wfTask == "Plans Coordination")&& wfStatus == "Route to EPR"){
 		sendEventToVelosimo("CreateEPRProject", capId);
 	}
	else if(wfTask == "Plans Coordination" && (wfStatus == "Plan Distributed"|| wfStatus == "Revision Distribution"))
  	{
	createPlanReviewSubTasks(capId);
    sendEventToVelosimo("CreateEPRAssignments", capId);
 	}
	
	else if (wfTask == "Plans Coordination" && (wfStatus == "Check-In Corrections" || wfStatus == "Approved"))
	{
	sendTaskEventToVelosimo("UpdatedWorkflowTask", capId, wfTask, wfStep, wfStatus);
	}
  }	


function createPlanReviewSubTasks(recordId)
{
	var wfObj = aa.workflow.getTasks(recordId).getOutput();
	var recordDocs = new Array();
  var allRecordDocs = aa.document.getCapDocumentList(recordId, lookup("EXTERNAL_DOC_REVIEW","VELOSIMO_ACCELA_USER")).getOutput();
	for(zz in allRecordDocs){
		var recDoc = allRecordDocs[zz];
		if(recDoc.getDocStatus() == "Routed to EPR" || recDoc.getDocStatus() == "Routed for Review" ){
			var validDocs = lookup("EPR_DOCUMENT_CATEGORY",recDoc.getDocCategory());
			if(validDocs != undefined)
			{
				recordDocs.push(recDoc);
			}
		}
	}
	var recordDocsList = java.util.Arrays.asList(recordDocs);

	var resTaskItems = [];
	for (i in wfObj)
	{
    taskItem = wfObj[i];
	
		var validTask = lookup("EPR_REVIEW_TASKS",taskItem.getTaskDescription());

   	if(validTask != undefined && taskItem.getActiveFlag() == "Y")
   	{
			logDebug("Task: "+taskItem.getTaskDescription());
	  	logDebug("Active: "+taskItem.getActiveFlag());

			for(j=0; j<recordDocsList.size(); j++)
			{
				rDoc = recordDocsList.get(j);
				logDebug("Checking if task as subtasks for this doc");
				logDebug("Name: "+rDoc.getFileName());
				logDebug("Doc: "+rDoc.getDocumentNo());
				logDebug("Related Doc: "+rDoc.getRelatedID());	

			  var v1Doc = rDoc;
				var relatedId = rDoc.getRelatedID();
				var relatedDoc = rDoc;

				while(relatedId != null)
				{
					var lastDoc = aa.document.getOriginalDoc(relatedDoc).getOutput()
					if(lastDoc == null)
					{
						break;	
					}
					v1Doc = lastDoc;
					relatedDoc = lastDoc;
					relatedId = lastDoc.getRelatedID();
				}
				logDebug("V1 Doc: "+v1Doc);

				var hasReviewers = aa.document.getRelatedReviewers(v1Doc.getDocumentNo(), taskItem.getTaskItem()).getOutput();
				if(hasReviewers.size() == 0)
				{
					logDebug("No subtasks found. Adding subtasks");
				
    			var usersList = new java.util.ArrayList();
    			usersList.add(taskItem.getAssignedStaff());

					var rDocs = new Array();
					rDocs.push(v1Doc);
    			var reviewTasks = aa.document.associateReviewer2Doc(rDocs, usersList, taskItem.getTaskItem());   
    
			    if(reviewTasks.getSuccess())
 				  { 
     		   	logDebug("Successfully added plan review tasks output="+reviewTasks.getOutput());
					 	rDoc.setDocStatus("Routed for Review");
						aa.document.updateDocument(rDoc);
   				}
   				else
   				{
      			logDebug("Error adding plan review tasks errmsg="+reviewTasks.getErrorMessage()+" output="+reviewTasks.getOutput());
   				}
				}
				else
				{
					logDebug("Task already has subtasks");
				}
				logDebug("");
			}							
 		}
	}
}

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

function logDebug(dstr) {
     aa.print(dstr);
     aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);
}
