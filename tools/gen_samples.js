const fs=require('fs');eval(fs.readFileSync('backend/Content.gs','utf8')+';global.C=CONTENT');
const P=[
['oilgas','Civil Job Performer','Samuel Otieno','Ruwais, UAE',4,'ats','NSH Contracting','Hail and Ghasha Project','Gulf Civil Works','Mussafah, UAE'],
['oilgas','Electrical Job Performer','Rakesh Kumar','Abu Dhabi, UAE',5,'ats','Emirates Power Contractors','Borouge 4 Project','Al Reem Electro','Abu Dhabi, UAE'],
['oilgas','Scaffolding Job Performer','Ibrahim Yusuf','Ruwais, UAE',3,'ats','Gulf Scaffold Services','Borouge 4 Project','Desert Access Co.','Mussafah, UAE'],
['oilgas','Piping Job Performer','Peter Mwangi','Ruwais, UAE',4,'ats','Al Noor Piping','Hail and Ghasha Project','Gulf Mechanical','Abu Dhabi, UAE'],
['oilgas','Rigger','David Kamau','Abu Dhabi, UAE',7,'ats','Gulf Lifting Services','ADNOC Shutdown','Falcon Heavy Lift','Jebel Ali, UAE'],
['oilgas','Welder (6G)','Mohammed Rafiq','Ruwais, UAE',9,'ats','Arabian Fabrication','Borouge 4 Project','Delta Welding Works','Sharjah, UAE'],
['oilgas','QA/QC Inspector','Faisal Ahmed','Abu Dhabi, UAE',8,'band','Gulf EPC Contractor','Hail and Ghasha Project','Meridian Inspection','Dubai, UAE'],
['construction','Steel Fixer','Joseph Ochieng','Dubai, UAE',6,'ats','Prime Rebar Works','Marina Tower','Al Khaleej Building','Sharjah, UAE'],
['construction','Site Foreman','Hassan Ali','Dubai, UAE',12,'band','Skyline Construction','Downtown Residential','Oasis Contracting','Abu Dhabi, UAE'],
['warehouse','Forklift Operator','Joseph Mwangi','Abu Dhabi, UAE',5,'ats','Al Noor Logistics','Mussafah Warehouses','Sahara Cargo','Dubai, UAE'],
['warehouse','Storekeeper','Daniel Njoroge','Jebel Ali, UAE',6,'side','Port Link Logistics','Jebel Ali Distribution Centre','Gulf Trading LLC','Dubai, UAE'],
['hse','HSE Officer','Amina Khan','Ruwais, UAE',8,'band','Gulf EPC Contractor','Petrochemical Package','Delta Construction','Abu Dhabi, UAE'],
['hse','Permit Receiver','Kevin Kiprop','Ruwais, UAE',5,'ats','Gulf Industrial Services','ADNOC Shutdown','Allied Maintenance','Abu Dhabi, UAE'],
['facilities','Electrician','Arun Nair','Dubai, UAE',8,'side','Prime Facilities','Business Bay Towers','Metro Electrical','Sharjah, UAE'],
['facilities','AC / HVAC Technician','Suresh Babu','Dubai, UAE',7,'side','CoolAir Services','Dubai Marina','Frost Technical','Ajman, UAE'],
['hospitality','Barista','Priya Sharma','Dubai, UAE',3,'side','Brew Street Cafe','Downtown Branch','Sweet Corner Bakery','Kochi, India'],
['hospitality','Waiter / Waitress','Grace Wanjiru','Dubai, UAE',4,'side','Marina Grill','Dubai Marina','Palm Bistro','Abu Dhabi, UAE'],
['corporate','Document Controller','Nadia Hussain','Abu Dhabi, UAE',6,'band','Gulf EPC Contractor','Petrochemical Package','Delta Engineering','Dubai, UAE'],
['corporate','Accountant','Rahul Menon','Dubai, UAE',7,'band','Horizon Trading','Head Office','Crescent Auditors','Sharjah, UAE'],
['security','Security Guard','Brian Otieno','Dubai, UAE',4,'ats','Shield Security Services','Mall Site','Guardian Services','Abu Dhabi, UAE'],
['healthcare','Nurse','Mary Achieng','Abu Dhabi, UAE',6,'band','City Care Hospital','Ward Nursing','Sunrise Clinic','Nairobi, Kenya'],
];
const out=[];
for(const [ind,role,name,city,yrs,style,c1,pj,c2,city2] of P){
 const I=C[ind],R=I.roles[role]; if(!R){console.error('MISSING',ind,role);process.exit(1)}
 const skills=[...new Set([...R.skills,...I.skills])].slice(0,14);
 const t=R.tasks;
 const sum=`${role} with ${yrs} years of hands-on experience in ${I.label}. Skilled in ${R.skills.slice(0,3).join(', ')}, with a record of ${I.trait}. Reliable, safety-conscious and able to adapt quickly to new sites, systems and teams across the UAE and GCC. Available to join immediately.`;
 out.push({name,role,ind:I.label,city,style,sum,comp:(I.comp||[]).slice(0,8),skills,pro:['Clear communication','Teamwork and cooperation','Time management','Problem solving','Reliability and punctuality','Attention to detail','Adaptability','Working under pressure'],
  jobs:[{t:role,c:c1,pj,pl:city,d:'Mar '+(2026-Math.min(yrs,4))+' - Present',b:t.slice(0,10)},{t:role,c:c2,pl:city2,d:'Jan '+(2026-yrs)+' - Feb '+(2026-Math.min(yrs,4)),b:t.slice(2,10)}]});
}
fs.writeFileSync('/tmp/samples.json',JSON.stringify(out));console.log(out.length,'samples',JSON.stringify(out).length,'bytes');
