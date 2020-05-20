vusername = aa.env.getValue("userId");
var user = aa.person.getUser(username).getOutput();

var rUser = {}
rUser.email = new String(user.getEmail());
rUser.username = new String(user.getGaUserID());
aa.env.setValue("user", JSON.stringify(rUser));