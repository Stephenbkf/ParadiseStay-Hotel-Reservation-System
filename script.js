let reservations = JSON.parse(localStorage.getItem("reservations")) || [];
let id = reservations.length;

/* =========================
   SAVE DATA
========================= */
function saveData(){
  localStorage.setItem("reservations", JSON.stringify(reservations));
}

/* =========================
   PAYMENT SYSTEM
========================= */
function showPaymentFields(){

  document.getElementById("gcashFields").style.display = "none";
  document.getElementById("cardFields").style.display = "none";
  document.getElementById("cashFields").style.display = "none";

  let p = document.getElementById("payment").value;

  if(p === "gcash"){
    document.getElementById("gcashFields").style.display = "block";
  }

  if(p === "card"){
    document.getElementById("cardFields").style.display = "block";
  }

  if(p === "cash"){
    document.getElementById("cashFields").style.display = "block";
  }
}

/* =========================
   RESERVE ROOM
========================= */
function reserveRoom(){

  let name = document.getElementById("name").value;
  let email = document.getElementById("email").value;
  let checkin = document.getElementById("checkin").value;
  let checkout = document.getElementById("checkout").value;

  let room = document.getElementById("room");

  let price = parseInt(room.value);
  let roomText = room.options[room.selectedIndex].text;

  let payment = document.getElementById("payment").value;

  // ROOM LIMITS
  const roomLimits = {
    "Standard Room - ₱2,500": 10,
    "Queen Room - ₱3,800": 8,
    "King Suite - ₱5,000": 5,
    "Family Room - ₱6,500": 4,
    "Deluxe Room - ₱4,200": 6,
    "Luxury Suite - ₱8,500": 3,
    "Budget Room - ₱1,800": 12,
    "Ocean View Room - ₱7,200": 4,
    "Executive Room - ₱9,000": 3,
    "Presidential Suite - ₱15,000": 1
  };

  // COUNT OCCUPIED ROOMS
  let occupiedRooms = reservations.filter(r =>
    r.roomText === roomText &&
    r.status === "Occupied"
  ).length;

  let totalRooms = roomLimits[roomText];

  let availableRooms = totalRooms - occupiedRooms;

  // FULLY OCCUPIED
  if(availableRooms <= 0){
    alert("Sorry! This room is fully occupied.");
    return;
  }

  // VALIDATION
  if(!name || !email || !checkin || !checkout || !payment){
    alert("Please fill all fields!");
    return;
  }

  // COMPUTE NIGHTS
  let nights =
    (new Date(checkout) - new Date(checkin))
    / (1000 * 60 * 60 * 24);

  if(nights <= 0){
    alert("Checkout must be after checkin!");
    return;
  }

  // TOTAL
  let total = nights * price;

  // CASH TICKET
  let ticket = payment === "cash"
    ? "TICKET-" + Math.floor(Math.random() * 900000)
    : "";

  // ROOM NUMBER & FLOOR
  let floor = Math.floor(Math.random() * 5) + 1;

  let roomNumber =
    floor + "" + (Math.floor(Math.random() * 20) + 1);

  // SAVE BOOKING
  reservations.push({
    id: id++,
    name,
    email,
    roomText,
    checkin,
    checkout,
    nights,
    payment,
    total,
    ticket,
    status: "Occupied",
    roomNumber,
    floor
  });

  saveData();

  render();
  renderAdmin();

  // UPDATED AVAILABLE ROOMS
  availableRooms--;

  // SUCCESS MESSAGE
  document.getElementById("result").innerHTML = `
    <div style="
      padding:20px;
      background:white;
      border-radius:12px;
      margin-top:15px;
      box-shadow:0 4px 15px rgba(0,0,0,0.1);
    ">

      <h3 style="color:green;">
        ✅ Booking Confirmed
      </h3>

      <p><b>Guest:</b> ${name}</p>

      <p><b>Room Type:</b> ${roomText}</p>

      <p><b>Room Number:</b> ${roomNumber}</p>

      <p><b>Floor:</b> ${floor} Floor</p>

      <p><b>Check In:</b> ${checkin}</p>

      <p><b>Check Out:</b> ${checkout}</p>

      <p><b>Stay:</b> ${nights} Night(s)</p>

      <p><b>Payment:</b> ${payment}</p>

      <p><b>Total:</b> ₱${total.toLocaleString()}</p>

      <p><b>Available Rooms Left:</b> ${availableRooms}</p>

      <p><b>Occupied Rooms:</b> ${occupiedRooms + 1}</p>

      ${
        payment === "cash"
        ? `<p><b>Ticket Number:</b> ${ticket}</p>`
        : ""
      }

    </div>
  `;

  // CLEAR FORM
  document.getElementById("name").value = "";
  document.getElementById("email").value = "";
  document.getElementById("checkin").value = "";
  document.getElementById("checkout").value = "";
  document.getElementById("payment").value = "";

  document.getElementById("gcashFields").style.display = "none";
  document.getElementById("cardFields").style.display = "none";
  document.getElementById("cashFields").style.display = "none";
}

/* =========================
   CHECK OUT ROOM
========================= */
function checkoutRoom(id){

  reservations = reservations.map(r => {

    if(r.id === id){
      r.status = "Vacant";
    }

    return r;
  });

  saveData();

  renderAdmin();

  alert("Guest checked out successfully!");
}

/* =========================
   CANCEL BOOKING
========================= */
function cancelBooking(id){

  reservations = reservations.filter(r => r.id !== id);

  saveData();

  render();
  renderAdmin();

  document.getElementById("result").innerHTML =
    `<p style="color:red;">Booking Cancelled ❌</p>`;
}

/* =========================
   USER TABLE
========================= */
function render(){

  let table = document.getElementById("historyTable");

  if(!table) return;

  table.innerHTML = "";

  reservations.forEach(r => {

    table.innerHTML += `
      <tr>
        <td>${r.name}</td>
        <td>${r.roomText}</td>
        <td>${r.roomNumber}</td>
        <td>${r.floor}</td>
        <td>${r.nights}</td>
        <td>${r.payment}</td>
        <td>₱${r.total.toLocaleString()}</td>
      </tr>
    `;
  });
}

/* =========================
   ADMIN TABLE
========================= */
function renderAdmin(){

  let adminTable = document.getElementById("adminTable");

  if(!adminTable) return;

  adminTable.innerHTML = "";

  let total = 0;

  reservations.forEach(r => {

    total += r.total;

    adminTable.innerHTML += `
      <tr>

        <td>${r.name}</td>

        <td>${r.roomText}</td>

        <td>${r.roomNumber}</td>

        <td>${r.floor}</td>

        <td>${r.checkin}</td>

        <td>${r.checkout}</td>

        <td>${r.nights} Night(s)</td>

        <td>${r.payment}</td>

        <td>₱${r.total.toLocaleString()}</td>

        <td>
          ${
            r.status === "Occupied"
            ? `<span style="color:red;font-weight:bold;">Occupied</span>`
            : `<span style="color:green;font-weight:bold;">Vacant</span>`
          }
        </td>

        <td>

          ${
            r.status === "Occupied"
            ? `
              <button
                onclick="checkoutRoom(${r.id})"
                style="
                  background:green;
                  color:white;
                  border:none;
                  padding:8px 12px;
                  border-radius:6px;
                  cursor:pointer;
                ">
                Check Out
              </button>
            `
            : `
              <button
                style="
                  background:gray;
                  color:white;
                  border:none;
                  padding:8px 12px;
                  border-radius:6px;
                ">
                Completed
              </button>
            `
          }

          <br><br>

          <button
            onclick="cancelBooking(${r.id})"
            style="
              background:red;
              color:white;
              border:none;
              padding:8px 12px;
              border-radius:6px;
              cursor:pointer;
            ">
            Cancel
          </button>

        </td>

      </tr>
    `;
  });

  // TOTAL BOOKINGS
  if(document.getElementById("totalBookings")){
    document.getElementById("totalBookings").innerText =
      reservations.length;
  }

  // TOTAL EARNINGS
  if(document.getElementById("totalEarnings")){
    document.getElementById("totalEarnings").innerText =
      "₱" + total.toLocaleString();
  }
}

/* =========================
   LOGIN SYSTEM
========================= */
function login(){

  let u = document.getElementById("user").value;
  let p = document.getElementById("pass").value;

  if(u === "admin" && p === "1234"){

    window.location.href = "admin.html";

  } else {

    document.getElementById("msg").innerText =
      "Wrong username or password";
  }
}

/* =========================
   LOGOUT
========================= */
function logout(){
  window.location.href = "login.html";
}

/* =========================
   AUTO LOAD
========================= */
window.onload = function(){

  reservations =
    JSON.parse(localStorage.getItem("reservations")) || [];

  render();
  renderAdmin();
};

async function getReservations() {
    const { data, error } = await supabase
        .from('reservations')
        .select('*');

    if (error) {
        console.error('Error fetching data:', error);
    } else {
        console.log('Reservations:', data);
    }
}

// Tawagin ang function para gumana
getReservations();

async function testConnection() {
    const { data, error } = await supabase.from('reservations').select('*');
    if (error) {
        console.error("May mali sa connection:", error.message);
    } else {
        console.log("Success! Nakakonekta na ang database. Ito ang data:", data);
    }
}
testConnection();

