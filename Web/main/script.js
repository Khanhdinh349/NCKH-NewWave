/* clock */
const hours = document.querySelector('.hours');
const minutes = document.querySelector('.minutes');
const seconds = document.querySelector('.seconds');

/* play button */
const play = document.querySelector('.play');
const pause = document.querySelector('.pause');
const playBtn = document.querySelector('.circle__btn');
const wave1 = document.querySelector('.circle__back-1');
const wave2 = document.querySelector('.circle__back-2');

/* rate slider */
const container = document.querySelector('.slider__box');
const btn = document.querySelector('.slider__btn');
const color = document.querySelector('.slider__color');
const tooltip = document.querySelector('.slider__tooltip');

clock = () => {
    let today = new Date();
    let h = (today.getHours() % 12) + today.getMinutes() / 59; // 22 % 12 = 10pm
    let m = today.getMinutes(); // 0 - 59
    let s = today.getSeconds(); // 0 - 59

    h *= 30; // 12 * 30 = 360deg
    m *= 6;
    s *= 6; // 60 * 6 = 360deg

    rotation(hours, h);
    rotation(minutes, m);
    rotation(seconds, s);

    // call every second
    setTimeout(clock, 500);
}

rotation = (target, val) => {
    target.style.transform = `rotate(${val}deg)`;
}

window.onload = clock();

dragElement = (target, btn) => {
    target.addEventListener('mousedown', (e) => {
        onMouseMove(e);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    });

    onMouseMove = (e) => {
        e.preventDefault();
        let targetRect = target.getBoundingClientRect();
        let x = e.pageX - targetRect.left + 10;
        if (x > targetRect.width) { x = targetRect.width };
        if (x < 0) { x = 0 };
        btn.x = x - 10;
        btn.style.left = btn.x + 'px';

        // get the position of the button inside the container (%)
        let percentPosition = (btn.x + 10) / targetRect.width * 100;

        // color width = position of button (%)
        color.style.width = percentPosition + "%";

        // move the tooltip when button moves, and show the tooltip
        tooltip.style.left = btn.x - 5 + 'px';
        tooltip.style.opacity = 1;

        // show the percentage in the tooltip
        tooltip.textContent = Math.round(percentPosition) + '%';
    };

    onMouseUp = (e) => {
        window.removeEventListener('mousemove', onMouseMove);
        tooltip.style.opacity = 0;

        btn.addEventListener('mouseover', function() {
            tooltip.style.opacity = 1;
        });

        btn.addEventListener('mouseout', function() {
            tooltip.style.opacity = 0;
        });
    };
};

dragElement(container, btn);

/* play button  */
playBtn.addEventListener('click', function(e) {
    e.preventDefault();
    pause.classList.toggle('visibility');
    play.classList.toggle('visibility');
    playBtn.classList.toggle('shadow');
    wave1.classList.toggle('paused');
    wave2.classList.toggle('paused');
});

var valueTemp = firebase.database().ref('NhietDoKK');
valueTemp.on('value', snap => {
    console.log("NhietDoKK: " + snap.val())
    document.getElementById("NhietDoKK").innerHTML = "Temperature: " + snap.val() + "°C"
});

var valueTemp = firebase.database().ref('DoAmKK');
valueTemp.on('value', snap => {
    console.log("DoAmKK: " + snap.val())
    document.getElementById("DoAmKK").innerHTML = "Humidity: " + snap.val() + " %"
});

// Lấy các nút và phần tử statusChip
const btnSecondary = document.getElementById('autoButton');
const btnPrimary = document.getElementById('manualButton');
const statusChip = document.getElementById('statusChip');

// Initial state - it's good practice to set an initial state if Firebase is empty
statusChip.innerText = 'Auto'; // Default to 'Auto' on load

// Reference to the StatusWeb in Firebase
const statusWebRef = firebase.database().ref('StatusWeb');
// Reference to the StatusButton in Firebase (this is what the physical device reads)
const statusButtonRef = firebase.database().ref('StatusButton');

// Function to update the status in Firebase
function updateStatusModes(webMode) {
    let buttonMode;
    if (webMode === 'Auto') {
        buttonMode = 'Manual'; // If web is Auto, set button to Manual
    } else { // webMode === 'Manual'
        buttonMode = 'Auto'; // If web is Manual, set button to Auto
    }

    // Update StatusWeb
    statusWebRef.set(webMode)
        .then(() => {
            console.log('StatusWeb updated in Firebase: ' + webMode);
        })
        .catch((error) => {
            console.error('Error updating StatusWeb in Firebase: ', error);
        });

    // Update StatusButton with the inverted logic
    statusButtonRef.set(buttonMode)
        .then(() => {
            console.log('StatusButton updated in Firebase (inverted): ' + buttonMode);
        })
        .catch((error) => {
            console.error('Error updating StatusButton in Firebase: ', error);
        });
}

// Event listeners for the web buttons to update StatusWeb and StatusButton (inverted)
btnSecondary.addEventListener('click', () => {
    updateStatusModes('Auto');
});

btnPrimary.addEventListener('click', () => {
    updateStatusModes('Manual');
});

// --- Synchronization Logic for Display ---
// Listen for changes in StatusWeb from Firebase to update the UI
// This listener assumes StatusWeb is the primary source for display on the web UI
statusWebRef.on('value', (snapshot) => {
    const modeFromWeb = snapshot.val();
    if (modeFromWeb) {
        // Update status chip with the mode from StatusWeb
        statusChip.innerText = modeFromWeb;
        console.log(`StatusChip updated from StatusWeb: ${modeFromWeb}`);

        // Visually indicate the active mode on the buttons
        if (modeFromWeb === 'Manual') {
            btnPrimary.classList.add('active-mode');
            btnSecondary.classList.remove('active-mode');
        } else if (modeFromWeb === 'Auto') {
            btnSecondary.classList.add('active-mode');
            btnPrimary.classList.remove('active-mode');
        }
    } else {
        // If StatusWeb is empty, default to 'Auto' and update Firebase with the initial inverted logic
        statusChip.innerText = 'Auto';
        updateStatusModes('Auto'); // This will set StatusWeb to 'Auto' and StatusButton to 'Manual'
        btnSecondary.classList.add('active-mode');
        btnPrimary.classList.remove('active-mode');
    }
});


// You can keep the motor position display as a separate listener
firebase.database().ref('status/motorposition').on('value', (motomodeSnapshot) => {
    const motor = motomodeSnapshot.val();
    // Get current mode from chip's text to combine with motor position
    const currentMode = statusChip.innerText.split(' ')[0];
    if (motor) {
        statusChip.innerText = `${currentMode} (${motor})`;
    } else {
        statusChip.innerText = `${currentMode} (Unknown)`;
    }
});