// ======================================================
// FactoryMind AI Dashboard
// Script.js
// ======================================================

// ---------------------------
// Live Clock
// ---------------------------

function updateClock() {

    const now = new Date();

    const options = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    };

    document.getElementById("clock").innerHTML =
        now.toLocaleTimeString([], options);

}

setInterval(updateClock, 1000);
updateClock();


// ---------------------------
// Counter Animation
// ---------------------------

function animateValue(id, start, end, duration) {

    const obj = document.getElementById(id);

    let range = end - start;

    let current = start;

    let increment = end > start ? 1 : -1;

    let stepTime = Math.abs(Math.floor(duration / range));

    let timer = setInterval(function () {

        current += increment;

        obj.innerHTML = current + "%";

        if (current == end) {

            clearInterval(timer);

        }

    }, stepTime);

}

animateValue("machineHealth", 70, 95, 1500);

animateValue("confidence", 75, 97, 1800);


// ---------------------------
// Hero Factory Health
// ---------------------------

let health = 96;

setInterval(() => {

    health += Math.floor(Math.random() * 3) - 1;

    if (health > 99) health = 99;

    if (health < 91) health = 91;

    document.querySelector(".status-circle h1").innerHTML =
        health + "%";

}, 3000);


// ---------------------------
// Random Sensor Values
// ---------------------------

setInterval(() => {

    document.getElementById("tempValue").innerHTML =
        Math.floor(Math.random() * 15 + 65) + "°C";

    document.getElementById("rpmValue").innerHTML =
        Math.floor(Math.random() * 300 + 1300);

    document.getElementById("energyValue").innerHTML =
        Math.floor(Math.random() * 30 + 115) + " kWh";

    let vibration = [

        "Normal",

        "Low",

        "Medium",

        "High"

    ];

    document.getElementById("vibrationValue").innerHTML =
        vibration[Math.floor(Math.random() * vibration.length)];

}, 4000);


// ---------------------------
// Random Prediction
// ---------------------------

setInterval(() => {

    document.getElementById("failurePrediction").innerHTML =
        Math.floor(Math.random() * 20 + 80) + "%";

    document.getElementById("rulValue").innerHTML =
        Math.floor(Math.random() * 40 + 10) + " hrs";

    document.getElementById("healthScore").innerHTML =
        Math.floor(Math.random() * 20 + 70) + "%";

}, 5000);


// ---------------------------
// Machine Hover Glow
// ---------------------------

document.querySelectorAll(".machine-card").forEach(machine => {

    machine.addEventListener("mouseenter", () => {

        machine.style.transform = "scale(1.04)";

    });

    machine.addEventListener("mouseleave", () => {

        machine.style.transform = "scale(1)";

    });

});


// ---------------------------
// Notification System
// ---------------------------

const notifications = [

    "⚠ CNC-07 Temperature Increased",

    "✔ Robot Arm Calibration Completed",

    "⚡ Energy Consumption Increased",

    "🤖 AI Generated Maintenance Plan",

    "📦 Warehouse Inventory Updated",

    "🔧 Conveyor Belt Requires Inspection"

];

function showNotification(text) {

    const div = document.createElement("div");

    div.className = "popup";

    div.innerHTML = text;

    document.body.appendChild(div);

    setTimeout(() => {

        div.classList.add("show");

    }, 100);

    setTimeout(() => {

        div.classList.remove("show");

        setTimeout(() => {

            div.remove();

        }, 400);

    }, 3500);

}

setInterval(() => {

    showNotification(

        notifications[Math.floor(Math.random() * notifications.length)]

    );

}, 9000);


// ---------------------------
// AI Chat Assistant
// ---------------------------

const sendBtn = document.getElementById("sendBtn");

const chatBody = document.getElementById("chatBody");

const chatInput = document.getElementById("chatInput");

sendBtn.addEventListener("click", sendMessage);

chatInput.addEventListener("keypress", function(e){

    if(e.key === "Enter"){

        sendMessage();

    }

});

function sendMessage(){

    let msg = chatInput.value.trim();

    if(msg === "") return;

    chatBody.innerHTML += `

    <div class="user-message">

        ${msg}

    </div>

    `;

    chatInput.value = "";

    setTimeout(()=>{

        let reply = generateReply(msg);

        chatBody.innerHTML += `

        <div class="ai-message">

            ${reply}

        </div>

        `;

        chatBody.scrollTop = chatBody.scrollHeight;

    },800);

}
// ======================================================
// FactoryMind AI Dashboard
// Script.js (Part 2)
// ======================================================


// ---------------------------
// AI Chat Replies
// ---------------------------

function generateReply(message){

    message = message.toLowerCase();

    if(message.includes("temperature")){

        return "Current factory temperature is within operational range except CNC-07, which is reporting higher than normal values.";

    }

    if(message.includes("machine")){

        return "24 out of 26 machines are operational. CNC-07 requires maintenance and Conveyor Belt requires inspection.";

    }

    if(message.includes("health")){

        return "Overall factory health is excellent at approximately 96%. One critical machine has been identified.";

    }

    if(message.includes("prediction")){

        return "The AI predicts a high probability of bearing failure in CNC-07 within the next 18 hours.";

    }

    if(message.includes("maintenance")){

        return "Maintenance has been scheduled automatically. Engineer A has been assigned to CNC-07.";

    }

    if(message.includes("energy")){

        return "Current energy usage is approximately 126 kWh. Consumption remains within acceptable limits.";

    }

    if(message.includes("hello") || message.includes("hi")){

        return "Hello! I'm FactoryMind AI. Ask me about machine health, maintenance, sensors, energy, or predictions.";

    }

    return "I understand your request. Based on current factory telemetry, no additional critical issues are detected.";

}


// ---------------------------
// Charts
// ---------------------------

function createChart(id,label,data,color){

    const canvas=document.getElementById(id);

    if(!canvas) return;

    new Chart(canvas,{

        type:"line",

        data:{

            labels:["8AM","10AM","12PM","2PM","4PM","6PM"],

            datasets:[{

                label:label,

                data:data,

                borderColor:color,

                backgroundColor:"rgba(0,229,255,0.08)",

                borderWidth:3,

                tension:.4,

                fill:true

            }]

        },

        options:{

            responsive:true,

            maintainAspectRatio:false,

            plugins:{

                legend:{

                    labels:{

                        color:"white"

                    }

                }

            },

            scales:{

                x:{

                    ticks:{color:"#ddd"},

                    grid:{color:"rgba(255,255,255,.08)"}

                },

                y:{

                    ticks:{color:"#ddd"},

                    grid:{color:"rgba(255,255,255,.08)"}

                }

            }

        }

    });

}

createChart(
    "tempChart",
    "Temperature",
    [65,67,69,72,70,68],
    "#ff5252"
);

createChart(
    "rpmChart",
    "RPM",
    [1200,1350,1450,1500,1420,1380],
    "#00E5FF"
);

createChart(
    "energyChart",
    "Energy",
    [90,105,110,120,126,118],
    "#22C55E"
);

createChart(
    "vibrationChart",
    "Vibration",
    [20,25,30,45,35,28],
    "#FACC15"
);


// ---------------------------
// Random Machine Highlight
// ---------------------------

const machineCards=document.querySelectorAll(".machine-card");

setInterval(()=>{

    machineCards.forEach(card=>{

        card.style.boxShadow="";

    });

    const random=Math.floor(Math.random()*machineCards.length);

    machineCards[random].style.boxShadow="0 0 25px cyan";

},4000);


// ---------------------------
// Simulated Alert Updates
// ---------------------------

const alertTitles=document.querySelectorAll(".alert h4");

const alertMessages=[

"Robot Arm Working Normally",

"Temperature Stabilized",

"Warehouse Inventory Updated",

"Energy Consumption Optimized",

"AI Inspection Completed",

"Predictive Maintenance Completed"

];

setInterval(()=>{

    if(alertTitles.length===0) return;

    const index=Math.floor(Math.random()*alertTitles.length);

    alertTitles[index].innerHTML=

        alertMessages[Math.floor(Math.random()*alertMessages.length)];

},6000);


// ---------------------------
// Animate KPI Cards
// ---------------------------

document.querySelectorAll(".kpi-card").forEach(card=>{

    card.addEventListener("mouseenter",()=>{

        card.style.transform="translateY(-10px) scale(1.02)";

    });

    card.addEventListener("mouseleave",()=>{

        card.style.transform="";

    });

});


// ---------------------------
// Hero Buttons
// ---------------------------

const primary=document.querySelector(".primary-btn");

if(primary){

    primary.addEventListener("click",()=>{

        document.querySelector(".digital-twin-section")
        .scrollIntoView({

            behavior:"smooth"

        });

    });

}

const secondary=document.querySelector(".secondary-btn");

if(secondary){

    secondary.addEventListener("click",()=>{

        document.querySelector(".ai-section")
        .scrollIntoView({

            behavior:"smooth"

        });

    });

}


// ---------------------------
// Sidebar Active State
// ---------------------------

document.querySelectorAll(".sidebar li").forEach(item=>{

    item.addEventListener("click",()=>{

        document.querySelectorAll(".sidebar li").forEach(li=>{

            li.classList.remove("active");

        });

        item.classList.add("active");

    });

});


// ---------------------------
// Startup Animation
// ---------------------------

window.addEventListener("load",()=>{

    document.querySelectorAll(

        ".kpi-card,.overview-card,.machine-card,.agent-card,.chart-card"

    ).forEach((card,index)=>{

        card.style.opacity="0";

        card.style.transform="translateY(25px)";

        setTimeout(()=>{

            card.style.transition=".6s";

            card.style.opacity="1";

            card.style.transform="translateY(0)";

        },index*80);

    });

});


console.log("✅ FactoryMind AI Dashboard Loaded Successfully");

