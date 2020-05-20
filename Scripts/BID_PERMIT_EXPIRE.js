/*------------------------------------------------------------------------------------------------------/
| Program: ExpirePermitsV1.0.js  Trigger: Batch    
| Client: Kern Couunty CA
| Version 1.0 - Base Version. Modified 08/14/2013 M. Hart
|  
| Script retrieves building permit records by the application type, expiration date, and 
| record status specified in batch job parameters. For each record retrieved the script:
|	-	Updates Workflow Status
|	- 	Updates the Record Status
|	-	Can Email the application contact person and attach the Expiration Letter
| 
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
|
| START: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var showMessage = false;				// Set to true to see results in popup window
var disableTokens = false;	
var showDebug = true;					// Set to true to see debug messages in email confirmation
var maxSeconds = 4 * 60;				// number of seconds allowed for batch processing, usually < 5*60
var autoInvoiceFees = "Y";    			// whether or not to invoice the fees added
var useAppSpecificGroupName = false;	// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;	// Use Group name when populating Task Specific Info Values
var currentUserID = "ADMIN"
var systemUserObj = aa.person.getUser("ADMIN").getOutput();
var GLOBAL_VERSION = 2.0

var cancel = false;

var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");

var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";						// Message String
var debug = "";							// Debug String
var br = "<BR>";						// Break Tag
var feeSeqList = new Array();			// invoicing fee list
var paymentPeriodList = new Array();	// invoicing pay periods
var bSetCreated = false; 				//Don't create a set until we find our first app
var setId = "";
var timeExpired = false;
var emailText = "";
var capId = null;
var cap = null;
var capIDString = "";
var appTypeResult = null;
var appTypeString = "";
var appTypeArray = new Array();
var capName = null;
var capStatus = null;
var fileDateObj = null;
var fileDate = null;
var fileDateYYYYMMDD = null;
var parcelArea = 0;
var estValue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var balanceDue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var capDetail = "";
var AInfo = new Array();
var partialCap = false;
var SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_CUSTOM"));

function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
//	var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),vScriptName,"ADMIN");
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}
/*------------------------------------------------------------------------------------------------------/
|
| END: USER CONFIGURABLE PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
//Needed HERE to log parameters below in eventLog
var sysDate = aa.date.getCurrentDate();
var batchJobID = aa.batchJob.getJobID().getOutput();
var batchJobName = "" + aa.env.getValue("batchJobName");
/*----------------------------------------------------------------------------------------------------/
|
| Start: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/

var appGroup = getParam("Group");								// app Group to process {Building}
var appTypeType = getParam("Type");								// app type to process {*}
var appSubtype = getParam("Subtype");							// app subtype to process {*}
var appCategory = getParam("Category");							// app category to process {*}
var asiField = getParam("asiField");							// ASI field (Plan Check Expires)
var asiFieldGroup = getParam("asiFieldGroup");					// ASI Sub Group (KEY DAYES)
asiFieldGroup = asiFieldGroup.toUpperCase();
var recordStatus = getParam("RecordStatus");					// Statuses to process,comma separated {In Review, In Review - Revision}
var task = getParam("task");
var newWfStatus = getParam("NewWfStatus");						// Change Workflow status to this {PC Expired}
var lookAheadDays = getParam("LookAheadDays");					// Number of days from today {-7}
var daySpan = getParam("DaySpan");								// Days to search {7}
var emailAddress = getParam("emailAddress");					// email to send report
var mSubjChoice = getParam("EmailSubject");						// Message subject resource from "Batch_Job_Messages" Std Choice
var mMesgChoice = getParam("EmailContent");						// Message content resource from "Batch_Job_Messages" Std Choice
var sendEmailNotifications = getParam("SendEmailNotification");	// send out emails
var setPrefix = getParam("setPrefix");							// prefix for the set id to be created
var reportName = getParam("ReportName")
/*
var appGroup = "Building";
var appTypeType = "*";
var appSubtype = "*";	
var appCategory = "*";	
var asiField = "Plan Check Expires";
asiFieldGroup = "KEY DATES"
var recordStatus = "In Review,In Review - Revision";
var task = "Plans Coordination";
var newWfStatus = "PC Expired";
var lookAheadDays = "-7";
var daySpan = "7";
var emailAddress = "mhart@accela.com";
var mSubjChoice = "";
var mMesgChoice = "";
var sendEmailNotifications = "N";
var setPrefix = ("PCEXP");
var reportName = "Test"
*/
/*----------------------------------------------------------------------------------------------------/
|
| End: BATCH PARAMETERS
|
/------------------------------------------------------------------------------------------------------*/
var fromDate = dateAdd(null,parseInt(lookAheadDays));
var toDate = dateAdd(null,parseInt(lookAheadDays)+parseInt(daySpan));
var dFromDate = aa.date.parseDate(fromDate);
var dToDate = aa.date.parseDate(toDate);
	
logMessage("From " + fromDate + " To " + toDate)

var appType = appGroup+"/"+appTypeType+"/"+appSubtype+"/"+appCategory;	
var mSubjEnConstant = null;
var mMesgEnConstant = null;

if (mSubjChoice) mSubjEnConstant = lookup("Email_Subjects",mSubjChoice);
if (mMesgChoice) mMesgEnConstant = lookup("Email_Subjects",mMesgChoice);

var paramsOK = true;
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
| 
/-----------------------------------------------------------------------------------------------------*/
if (paramsOK)
	{
	logMessage("Start of Job");

	var recStat = recordStatus.split(",");
	for (icount in recStat)
		if (!timeExpired) expirePermits(recStat[icount]);

	logMessage("End of Job: Elapsed Time : " + elapsed() + " Seconds");
	}
aa.print(message);
if (emailAddress.length) 
	aa.sendMail("noreply@accela.com", emailAddress, "", batchJobName + " Results", message);
		
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/


/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function expirePermits(recStat)
{
	var capCount = 0;
	var capResult = aa.cap.getCapIDsByAppSpecificInfoDateRange(asiFieldGroup, asiField, dFromDate, dToDate);
	
	if (capResult.getSuccess()) 
	{
		myCaps = capResult.getOutput();
	}
	else 
	{ 
		logMessage("ERROR: Getting records, reason is: " + capResult.getErrorMessage()) ;
		return false
	} 

	for (myCapsXX in myCaps) 
	{
		if (elapsed() > maxSeconds) 
		{ // only continue if time hasn't expired
			logMessage("WARNING","A script timeout has caused partial completion of this process.  Please re-run.  " + elapsed() + " seconds elapsed, " + maxSeconds + " allowed.") ;
			timeExpired = true ;
			break; 
		}
		
		feeSeqList = new Array();
		paymentPeriodList = new Array();
		
    	var thisCapId = myCaps[myCapsXX];
		capId = aa.cap.getCapID(thisCapId.getCapID().getID1(),thisCapId.getCapID().getID2(),thisCapId.getCapID().getID3()).getOutput();
  
		if (!capId) 
		{
			logMessage("Could not get Cap ID");
			continue;
		}
		servProvCode = "KERNCO"
		altId = capId.getCustomID();
		cap = aa.cap.getCap(capId).getOutput();		

		appTypeResult = cap.getCapType();
		capStatus = cap.getCapStatus();		
		appTypeString = appTypeResult.toString();	
		appTypeArray = appTypeString.split("/");

		if (appType.length && !appMatch(appType)) 
			continue;
	
		if (capStatus != recStat)
			continue;
			
		if(appTypeArray[1] == "City Commercial" || appTypeArray[1] == "City Residential" || appTypeArray[1] == "City")
			continue;
				
		if(isTaskActive(task))
			{
			//If our set hasn't been created yet, create now because we are processing a CAP (You need at least one CAP to create the SET)
				if( !bSetCreated )
				{
					setId = createExpirationSet(setPrefix );
					bSetCreated = true;
				}
				
				logMessage("Expiring Permit " + altId + " With Expiration Date " + getAppSpecific(asiField));
				updateTask(task, newWfStatus, "Updated by renewal script");
				updateAppStatus(newWfStatus, "Updated by renewal script");
					
			//Run Report
				report = aa.reportManager.getReportInfoModelByName(reportName);
				if (report.getSuccess())
				{
					report = report.getOutput();
	
					report.setModule(appGroup);
					report.setCapId(capId);
					report.getEDMSEntityIdModel().setAltId(capIDString);

					var parameters = aa.util.newHashMap();
					parameters.put("serviceProviderCode", servProvCode);
					parameters.put("altID", altId);
					report.setReportParameters(parameters);

					var permit = aa.reportManager.hasPermission(reportName,currentUserID);
					if(permit.getOutput().booleanValue())
					{
						var reportResult = aa.reportManager.getReportResult(report);
						logMessage("Report " + report + " Report Result " + reportResult)
						if(reportResult.getSuccess()) 
						{
							reportResult = reportResult.getOutput();
							var reportFile = aa.reportManager.storeReportToDisk(reportResult);
							reportFile = reportFile.getOutput();
						}
						else
						{
							logMessage("Could not get report from report manager normally, error message please refer to: " + reportResult.getErrorMessage())
						}
					}
					else 
					{
						logMessage("No permission to report: "+ reportName);
					}
				}
				else
				{
					logMessage("Invalid Report Name entered in parameter: " + reportName);
				}	
	
	
				//Add CAP to Set
				var setAddResult = aa.set.add(setId, "", capId, "");
				if ( !setAddResult.getSuccess() )
					logDebug("Problem occurred when adding CAP # " + altId + " to Set ID " + setId+"<br>");
		
				createCapComment("Permit Plan Check expired on  " +  getAppSpecific("Plan Check Expires") + "Record status set to " + newWfStatus + " by Permit Expire batch job.");
		
				if (mSubjEnConstant) 	{ mSubjEn = replaceMessageTokens(mSubjEnConstant); }
				if (mMesgEnConstant) 	{ mMesgEn = replaceMessageTokens(mMesgEnConstant); }
		
				conArray = getContactArray(capId)
				for (thisCon in conArray)
				{
					b3Contact = conArray[thisCon];
					if (b3Contact["contactType"] == "Contact")
					{
						conEmail = b3Contact["email"];
						if (conEmail && sendEmailNotifications.substring(0,1).toUpperCase().equals("Y")) 						        
            				var sendResult = aa.sendEmail("noreply@accela.com", conEmail, "", "Permit " + altId + " is due for renewal", "Attached is your Renewal Notice for permit " + altId, reportFile);	
					}
				
				}

				capCount++;
			}
	}
	logMessage("Processed " + capCount + " Records of Status " + recStat);	
}	

/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function getParam(pParamName) //gets parameter value and logs message showing param value
	{
	var ret = "" + aa.env.getValue(pParamName);	
	logMessage(pParamName+" = "+ret);
	return ret;
	}
function elapsed()
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	return ((thisTime - startTime) / 1000) 
	}

 function createExpirationSet( prefix )
{
	// Create Set
	if (prefix != "")
	{
		var yy = startDate.getFullYear().toString().substr(2,2);
		var mm = (startDate.getMonth() +1 ).toString(); //getMonth() returns (0 - 11)
		if (mm.length<2)
			mm = "0"+mm;
		var dd = startDate.getDate().toString();
		if (dd.length<2)
			dd = "0"+dd;
		var hh = startDate.getHours().toString();
		if (hh.length<2)
			hh = "0"+hh;
		var mi = startDate.getMinutes().toString();
		if (mi.length<2)
			mi = "0"+mi;

		var setName = prefix.substr(0,5) + yy + mm + dd;

		setDescription = prefix + " : " + mm + dd + yy;
		
		setResult = aa.set.getSetByPK(setName);
		setExist = false;
		setExist = setResult.getSuccess();
		if (!setExist) 
		{
			var setCreateResult= aa.set.createSet(setName,setDescription);
			if( setCreateResult.getSuccess() )
			{
				logDebug("New Set ID "+setName+" created for CAPs processed by this batch job.<br>");
				return setName;
			}
			else
				logDebug("ERROR: Unable to create new Set ID "+setName+" for CAPs processed by this batch job.");
		}
		else
		{
			logDebug("Set " + setName + " already exists and will be used for this batch run<br>");
			return setName;
		}
	}
}