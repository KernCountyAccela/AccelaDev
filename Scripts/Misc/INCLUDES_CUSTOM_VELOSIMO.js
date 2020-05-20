function sendEventToVelosimo(eventName, capId) 
{
  var vClient = new VelosimoClient();
	vClient.recordId = capId
  vClient.eventName = eventName;
  res = vClient.sendRequest();
  logDebug("Response from Velosimo "+res);
}

function sendEventToVelosimoWithKeys(eventName, capId, tenantKey, tenantToken)
{
  var vClient = new VelosimoClient();
  vClient.recordId = capId
  vClient.eventName = eventName;
  vClient.tenantKey = tenantKey;
  vClient.tenantToken = tenantToken;
  res = vClient.sendRequest();
  logDebug("Response from Velosimo "+res);
}

function sendTaskEventToVelosimo(eventName, capId, taskName, taskId, taskStatus) 
{
  var vClient = new VelosimoClient();
  vClient.recordId = capId
  vClient.eventName = eventName;
  vClient.taskName = taskName;
  vClient.taskId = taskId;
  vClient.taskStatus = taskStatus;
  res = vClient.sendRequest();
  logDebug("Response from Velosimo "+res);
}
function sendAssignToVelosimo(capId, taskName, taskId, wfAssignedStaff, wfAssignedDate, wfDueDate) 
{
  var vClient = new VelosimoClient();
  vClient.recordId = capId
  vClient.eventName = "assignEPRSubTask";
  vClient.taskName = taskName;
  vClient.taskId = taskId;
  vClient.wfAssignedStaff = wfAssignedStaff;
  vClient.wfAssignedDate = wfAssignedDate;
	vClient.wfDueDate = wfDueDate;
  res = vClient.sendRequest();
  logDebug("Response from Velosimo "+res);
}

function VelosimoClient() {
  this.apiURL = lookup("EXTERNAL_DOC_REVIEW","VELOSIMO_URL")+"/api/v2/accela/emseevents.json";
  this.eventName = null;
  this.recordId = null;
  this.docId = null;
  this.taskName = null; 
	this.taskId = null; 
	this.taskStatus = null;
  this.wfAssignedStaff = null;
  this.wfAssignedDate = null;
	this.wfDueDate = null;

  this.buildHeaders = function () {
    var headers=aa.util.newHashMap();
    headers.put("Content-Type","application/json");
    headers.put("X-Tenant-Access-Key", lookup("EXTERNAL_DOC_REVIEW", "VELOSIMO_TENANT_KEY"));
    headers.put("X-Tenant-Access-Token", lookup("EXTERNAL_DOC_REVIEW", "VELOSIMO_TENANT_TOKEN"));
    return headers;
  }

  this.buildPostBody = function() {
    var body= {};
		var eventData = {};

    if (this.recordId != null) 
		{
			eventData.recordID = new String(this.recordId.getID1()+"-"+this.recordId.getID2()+"-"+this.recordId.getID3());
			eventData.customId = new String(this.recordId.getCustomID());
		}
  	if (this.docId != null) 
  	{
			eventData.docId = new String(this.docId);
  	}
    if(this.taskName != null)
    {
        eventData.taskName = new String(this.taskName);
    }
    if(this.taskId != null)
    {
        eventData.taskId = new String(this.taskId);
    }
    if(this.taskStatus != null)
    {
        eventData.taskStatus = new String(this.taskStatus);
    }
	if(this.wfAssignedStaff != null)
    {
        eventData.wfAssignedStaff = new String(this.wfAssignedStaff);
    }
	if(this.wfAssignedDate != null)
    {
        eventData.wfAssignedDate = new String(this.wfAssignedDate);
    }
		if(this.wfDueDate != null)
		{
			eventData.wfDueDate = new String(this.wfDueDate);
		}
		

    body.eventName = new String(this.eventName);
	  body.eventData = eventData;
    var jsonBody = JSON.stringify(body);

    return jsonBody;
  }

  this.sendRequest = function() {
    var result = aa.httpClient.post(this.apiURL, this.buildHeaders(), this.buildPostBody());
    var response = result.getOutput();
    return response;
  }
}


function loadCustomScript(scriptName) {

    try {
        scriptName = scriptName.toUpperCase();
        var emseBiz = aa.proxyInvoker.newInstance(
                "com.accela.aa.emse.emse.EMSEBusiness").getOutput();
        var emseScript = emseBiz.getScriptByPK(aa.getServiceProviderCode(),
                scriptName, "ADMIN");
        eval(emseScript.getScriptText() + "");

    } catch (error) {
        showDebug = true;
        logDebug("<font color='red'><b>WARNING: Could not load script </b></font>" + scriptName + ". Verify the script in <font color='blue'>Classic Admin>Admin Tools>Events>Scripts</font>");
    }
}