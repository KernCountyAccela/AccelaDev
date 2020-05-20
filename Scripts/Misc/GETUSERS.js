var peopleBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleBusiness").getOutput();
var users = peopleBiz.getInspectors4API("KERNCO", null, null, false); 
var rUsers = new Array();
aa.print(users.size());
for(i=0; i<users.size(); i++)
{
    user = users.get(i)
    if(user.getDeptOfUser() == "KERNCO/KERNCO/KERNCO/PUBLIC/NA/NA/NA")
    {
      continue;
    }

    var rUser = {}
    rUser.fullName = new String(user.getFullName());
    rUser.email = new String(user.getEmail());
    rUser.username = new String(user.getGaUserID());
    rUser.department = new String(user.getDeptOfUser());
    rUsers.push(rUser);
}
aa.env.setValue("users", JSON.stringify(rUsers));
aa.print(JSON.stringify(rUsers));