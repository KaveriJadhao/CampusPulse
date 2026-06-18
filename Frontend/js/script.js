const API = "http://localhost:5000/api";

// LOGIN CHECK
const user = JSON.parse(localStorage.getItem("user"));
const currentPage = window.location.pathname;
const currentFile = currentPage.split("/").pop();

// REDIRECT IF NOT LOGGED IN
if (
  !user &&
  currentFile !== "index.html" &&
  currentFile !== "signup.html"
) {
  window.location.href = "index.html";
}

// PAGE PROTECTION
if (user) {
  if (user.role === "student") {
    const blockedStudentPages = [
      "create-event.html",
      "manage-events.html",
      "edit-event.html",
      "attendance.html",
      "admin-dashboard.html",
    ];

    if (blockedStudentPages.includes(currentFile)) {
      alert("Access Denied");
      window.location.href = "dashboard.html";
    }
  }

  if (user.role === "forum-admin") {
    const blockedForumAdminPages = [
      "admin-dashboard.html",
    ];

    if (blockedForumAdminPages.includes(currentFile)) {
      alert("Access Denied");
      window.location.href = "dashboard.html";
    }
  }
}

// LOGOUT
function logout() {
  localStorage.removeItem("user");
  window.location.href = "index.html";
}
// CREATE EVENT
const eventForm = document.getElementById("eventForm");

if (eventForm) {
  eventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(eventForm);

    const eventData = {
      title: formData.get("title"),
      category: formData.get("category"),
      organizer: formData.get("organizer"),
      date: formData.get("date"),
      time: formData.get("time"),
      venue: formData.get("venue"),
      fee: formData.get("fee"),
      description: formData.get("description"),
    };

    const response = await fetch(`${API}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (response.ok) {
      alert("Event created successfully!");
      eventForm.reset();
    } else {
      alert("Failed to create event");
    }
  });
}

// EVENTS PAGE
const eventsContainer = document.getElementById("eventsContainer");

let allEvents = [];

if (eventsContainer) {
  loadEvents();
}

async function loadEvents() {
  const response = await fetch(`${API}/events`);
  allEvents = await response.json();

  displayEvents(allEvents);
}

function displayEvents(events) {
  eventsContainer.innerHTML = "";

  if (events.length === 0) {
    eventsContainer.innerHTML = `
      <div class="empty-state">
        <h3>No Events Available</h3>
        <p>Create your first event.</p>
      </div>
    `;
    return;
  }

  events.forEach((event) => {
    eventsContainer.innerHTML += `
      <div class="big-event-card">
        <div class="event-banner purple">
          ${event.category}
        </div>

        <div class="event-info">
          <h3>${event.title}</h3>
          <p>${event.organizer}</p>

          <span>📅 ${event.date}</span>
          <span>⏰ ${event.time}</span>
          <span>📍 ${event.venue}</span>
          <span>💰 ₹${event.fee}</span>

          <a href="event-details.html?id=${event._id}" class="view-btn">
            View Details
          </a>
        </div>
      </div>
    `;
  });
}
// SEARCH + FILTER
const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const departmentFilter = document.getElementById("departmentFilter");

function filterEvents() {
  let filtered = allEvents;

  const searchText = searchInput?.value.toLowerCase() || "";
  const selectedCategory = categoryFilter?.value || "All";
  const selectedDepartment = departmentFilter?.value || "All";

  if (searchText) {
    filtered = filtered.filter((event) =>
      event.title.toLowerCase().includes(searchText)
    );
  }

  if (selectedCategory !== "All") {
    filtered = filtered.filter((event) => event.category === selectedCategory);
  }

  if (selectedDepartment !== "All") {
    filtered = filtered.filter((event) => event.organizer === selectedDepartment);
  }

  displayEvents(filtered);
}

if (searchInput) searchInput.addEventListener("input", filterEvents);
if (categoryFilter) categoryFilter.addEventListener("change", filterEvents);
if (departmentFilter) departmentFilter.addEventListener("change", filterEvents);

// EVENT DETAILS
const urlParams = new URLSearchParams(window.location.search);
const currentEventId = urlParams.get("id");

if (currentEventId && document.getElementById("eventTitle")) {
  loadEventDetails();
}

async function loadEventDetails() {
  const response = await fetch(`${API}/events/${currentEventId}`);
  const event = await response.json();

  document.getElementById("eventCategory").textContent = event.category;
  document.getElementById("eventTitle").textContent = event.title;
  document.getElementById("eventDescription").textContent = event.description;
  document.getElementById("eventAbout").textContent = event.description;
  document.getElementById("eventDate").textContent = event.date;
  document.getElementById("eventTime").textContent = event.time;
  document.getElementById("eventVenue").textContent = event.venue;
  document.getElementById("eventFee").textContent = `₹${event.fee}`;
  document.getElementById("eventOrganizer").textContent = event.organizer;
  document.getElementById("eventShort").textContent = event.category
    .slice(0, 3)
    .toUpperCase();
}

// REGISTER BUTTON
const registerBtn = document.getElementById("registerBtn");

if (registerBtn) {
  registerBtn.addEventListener("click", () => {
    window.location.href = `register.html?id=${currentEventId}`;
  });
}


// REGISTRATION FORM WITH RAZORPAY PAYMENT
const registrationForm = document.getElementById("registrationForm");

if (registrationForm) {
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(registrationForm);

    const registrationData = {
      eventId: currentEventId,
      studentName: formData.get("studentName"),
      email: formData.get("email"),
      branch: formData.get("branch"),
      year: formData.get("year"),
      paymentStatus: "Paid",
    };

    // GET EVENT DETAILS
    const eventResponse = await fetch(
      `${API}/events/${currentEventId}`
    );

    const event = await eventResponse.json();

    const amount = Number(event.fee || 0);

    // FREE EVENT
    if (amount === 0) {
      await saveRegistration(registrationData);
      return;
    }

    // CREATE PAYMENT ORDER
    const orderResponse = await fetch(
      `${API}/payment/create-order`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
        }),
      }
    );

    const orderData = await orderResponse.json();

    const options = {
      key: orderData.key,
      amount: orderData.order.amount,
      currency: "INR",
      name: "CampusPulse",
      description: event.title,
      order_id: orderData.order.id,

      handler: async function () {
        await saveRegistration(registrationData);
      },

      prefill: {
        name: registrationData.studentName,
        email: registrationData.email,
      },

      theme: {
        color: "#6d28d9",
      },
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  });
}

// SAVE REGISTRATION
async function saveRegistration(registrationData) {
  const response = await fetch(`${API}/registrations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(registrationData),
  });

  const result = await response.json();

  if (response.ok) {
    alert("Registration Successful!");
    registrationForm.reset();
    window.location.href = "my-registrations.html";
  } else {
    alert(result.message || "Registration Failed");
  }
}

// SIGNUP
const signupForm = document.getElementById("signupForm");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(signupForm);

    const userData = {
  fullName: formData.get("fullName"),
  email: formData.get("email"),
  password: formData.get("password"),
  role: "student",
  branch: formData.get("branch"),
  year: formData.get("year"),
  };

    const response = await fetch(`${API}/users/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Signup successful! Please login.");
      window.location.href = "index.html";
    } else {
      alert(result.message || "Signup failed");
    }
  });
}

// LOGIN
const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(loginForm);

    const loginData = {
      email: formData.get("email"),
      password: formData.get("password"),
    };

    const response = await fetch(`${API}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify(result.user));

      if (result.user.role === "student") {
        window.location.href = "dashboard.html";
      } else if (result.user.role === "forum-admin") {
        window.location.href = "manage-events.html";
      } else {
        window.location.href = "admin-dashboard.html";
      }
    } else {
      alert(result.message || "Login failed");
    }
  });
}
// NOTICE BOARD
const noticeForm = document.getElementById("noticeForm");
const noticesList = document.getElementById("noticesList");
const noticePostSection = document.getElementById("noticePostSection");

if (noticePostSection && user?.role === "student") {
  noticePostSection.style.display = "none";
}
if (noticeForm) {
  noticeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(noticeForm);

    const noticeData = {
      title: formData.get("title"),
      category: formData.get("category"),
      department: formData.get("department"),
      description: formData.get("description"),
    };

    const response = await fetch(`${API}/notices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(noticeData),
    });

    if (response.ok) {
      alert("Notice posted successfully!");
      noticeForm.reset();
      loadNotices();
    } else {
      alert("Failed to post notice");
    }
  });
}

if (noticesList) {
  loadNotices();
}

async function loadNotices() {
  const response = await fetch(`${API}/notices`);
  const notices = await response.json();

  noticesList.innerHTML = "";

  notices.forEach((notice) => {
    noticesList.innerHTML += `
      <div class="notice">
        <span>📢</span>
        <p>
          <strong>${notice.title}</strong><br>
          ${notice.department} • ${notice.category}<br>
          ${notice.description}
        </p>
        <small>New</small>
      </div>
    `;
  });
}

// MANAGE EVENTS
const manageEventsList = document.getElementById("manageEventsList");

if (manageEventsList) {
  loadManageEvents();
}

async function loadManageEvents() {
  const response = await fetch(`${API}/events`);
  const events = await response.json();

  manageEventsList.innerHTML = "";

  events.forEach((event) => {
    manageEventsList.innerHTML += `
      <div class="event-item">
        <div>
          <h3>${event.title}</h3>
          <p>${event.organizer}</p>
          <small>${event.date} • ${event.venue}</small>
        </div>

        <div>
          <button onclick="editEvent('${event._id}')">Edit</button>
          <button onclick="deleteEvent('${event._id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

function editEvent(id) {
  window.location.href = `edit-event.html?id=${id}`;
}

async function deleteEvent(id) {
  const confirmDelete = confirm("Are you sure you want to delete this event?");

  if (!confirmDelete) return;

  const response = await fetch(`${API}/events/${id}`, {
    method: "DELETE",
  });

  if (response.ok) {
    alert("Event deleted successfully");
    loadManageEvents();
  } else {
    alert("Failed to delete event");
  }
}

// EDIT EVENT
const editEventForm = document.getElementById("editEventForm");

if (editEventForm) {
  loadEditEvent();

  editEventForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = new URLSearchParams(window.location.search).get("id");
    const formData = new FormData(editEventForm);

    const updatedData = {
      title: formData.get("title"),
      category: formData.get("category"),
      organizer: formData.get("organizer"),
      date: formData.get("date"),
      time: formData.get("time"),
      venue: formData.get("venue"),
      fee: formData.get("fee"),
      description: formData.get("description"),
    };

    const response = await fetch(`${API}/events/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (response.ok) {
      alert("Event updated successfully!");
      window.location.href = "manage-events.html";
    } else {
      alert("Failed to update event");
    }
  });
}

async function loadEditEvent() {
  const id = new URLSearchParams(window.location.search).get("id");

  const response = await fetch(`${API}/events/${id}`);
  const event = await response.json();

  document.getElementById("editTitle").value = event.title;
  document.getElementById("editCategory").value = event.category;
  document.getElementById("editOrganizer").value = event.organizer;
  document.getElementById("editDate").value = event.date;
  document.getElementById("editTime").value = event.time;
  document.getElementById("editVenue").value = event.venue;
  document.getElementById("editFee").value = event.fee;
  document.getElementById("editDescription").value = event.description;
}

// ADMIN DASHBOARD
const totalEvents = document.getElementById("totalEvents");
const totalRegistrations = document.getElementById("totalRegistrations");
const registrationsList = document.getElementById("registrationsList");
const eventStats = document.getElementById("eventStats");

if (totalEvents && totalRegistrations && registrationsList) {
  loadAdminDashboard();
}

async function loadAdminDashboard() {
  const events = await (await fetch(`${API}/events`)).json();
  const registrations = await (await fetch(`${API}/registrations`)).json();

  totalEvents.textContent = events.length;
  totalRegistrations.textContent = registrations.length;

  registrationsList.innerHTML = "";

  registrations.forEach((reg) => {
    registrationsList.innerHTML += `
      <div class="notice">
        <span>👤</span>
        <p>
          <strong>${reg.studentName}</strong><br>
          ${reg.branch} • ${reg.year}<br>
          Event: ${reg.eventId?.title || "Event"}
        </p>
        <small>${reg.email}</small>
      </div>
    `;
  });

  if (eventStats) {
    const eventCounts = {};

    registrations.forEach((reg) => {
      const title = reg.eventId?.title || "Unknown Event";
      eventCounts[title] = (eventCounts[title] || 0) + 1;
    });

    eventStats.innerHTML = "";

    for (const eventName in eventCounts) {
      eventStats.innerHTML += `
        <div class="stat-card">
          <h3>${eventName}</h3>
          <p>Total Participants: ${eventCounts[eventName]}</p>

          <button onclick="downloadParticipants('${eventName}')">
            Download CSV
          </button>
        </div>
      `;
    }
  }
}

async function downloadParticipants(eventName) {
  const registrations = await (await fetch(`${API}/registrations`)).json();

  const filtered = registrations.filter(
    (reg) => reg.eventId?.title === eventName
  );

  let csv = "Name,Email,Branch,Year\n";

  filtered.forEach((reg) => {
    csv += `${reg.studentName},${reg.email},${reg.branch},${reg.year}\n`;
  });

  const blob = new Blob([csv], {
    type: "text/csv",
  });

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = `${eventName}-participants.csv`;

  a.click();

  window.URL.revokeObjectURL(url);
}

// MY REGISTRATIONS
const myRegistrationsList = document.getElementById("myRegistrationsList");

if (myRegistrationsList) {
  loadMyRegistrations();
}

async function loadMyRegistrations() {
  const registrations = await (await fetch(`${API}/registrations`)).json();

  myRegistrationsList.innerHTML = "";

  const userRegistrations = user
    ? registrations.filter((reg) => reg.email === user.email)
    : registrations;

  if (userRegistrations.length === 0) {
    myRegistrationsList.innerHTML = "<p>No registrations yet.</p>";
    return;
  }

  userRegistrations.forEach((reg) => {
    myRegistrationsList.innerHTML += `
      <div class="event-item">
        <div class="event-img purple">✓</div>

        <div>
          <h3>${reg.eventId?.title || "Event"}</h3>
          <p>${reg.eventId?.organizer || "Organizer"}</p>
          <small>${reg.eventId?.date || ""} • ${reg.eventId?.venue || ""}</small>
        </div>

        <button>Registered</button>
      </div>
    `;
  });
}

// MARK ATTENDANCE
const attendanceForm = document.getElementById("attendanceForm");

if (attendanceForm) {
  attendanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const eventId = new URLSearchParams(window.location.search).get("id");
    const formData = new FormData(attendanceForm);
    const email = formData.get("email");

    const registrations = await (await fetch(`${API}/registrations`)).json();

    const student = registrations.find(
      (reg) => reg.email === email && reg.eventId?._id === eventId
    );

    if (!student) {
      alert("You are not registered for this event.");
      return;
    }

    const attendanceData = {
      eventId: eventId,
      studentName: student.studentName,
      email: student.email,
      branch: student.branch,
      year: student.year,
    };

    const response = await fetch(`${API}/attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attendanceData),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Attendance marked successfully!");
      attendanceForm.reset();
    } else {
      alert(result.message || "Attendance failed");
    }
  });
}
// ATTENDANCE BUTTON
const attendanceBtn = document.getElementById("attendanceBtn");

if (attendanceBtn) {
  attendanceBtn.addEventListener("click", () => {
    window.location.href = `mark-attendance.html?id=${currentEventId}`;
  });
}

// ATTENDANCE LIST
const attendanceList = document.getElementById("attendanceList");

if (attendanceList) {
  loadAttendance();
}

async function loadAttendance() {
  const attendance = await (
    await fetch(`${API}/attendance`)
  ).json();

  attendanceList.innerHTML = "";

  if (attendance.length === 0) {
    attendanceList.innerHTML =
      "<p>No attendance records found.</p>";
    return;
  }

  attendance.forEach((item) => {
    attendanceList.innerHTML += `
      <div class="notice">
        <span>✅</span>
        <p>
          <strong>${item.studentName}</strong><br>
          ${item.email}<br>
          ${item.branch} • ${item.year}<br>
          Event: ${item.eventId?.title || "Event"}
        </p>
        <small>${item.status || "Present"}</small>
      </div>
    `;
  });
}

// DYNAMIC DASHBOARD
const dashboardEvents = document.getElementById("dashboardEvents");
const dashboardRegistrations = document.getElementById("dashboardRegistrations");
const dashboardCertificates = document.getElementById("dashboardCertificates");
const dashboardNotices = document.getElementById("dashboardNotices");

const dashboardEventsList = document.getElementById("dashboardEventsList");
const dashboardNoticesList = document.getElementById("dashboardNoticesList");

const dashboardUserName = document.getElementById("dashboardUserName");
const welcomeText = document.getElementById("welcomeText");
const todayDate = document.getElementById("todayDate");

if (dashboardEvents) {
  loadDashboardData();
}

async function loadDashboardData() {
  if (user) {
    if (dashboardUserName) {
      dashboardUserName.textContent =
        `Welcome, ${user.fullName}`;
    }

    if (welcomeText) {
      welcomeText.textContent =
        `Welcome back, ${user.fullName} 👋`;
    }
  }

  if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );
  }

  const events = await (
    await fetch(`${API}/events`)
  ).json();

  const registrations = await (
    await fetch(`${API}/registrations`)
  ).json();

  const attendance = await (
    await fetch(`${API}/attendance`)
  ).json();

  const notices = await (
    await fetch(`${API}/notices`)
  ).json();

  const myRegistrations = user
    ? registrations.filter(
        (reg) => reg.email === user.email
      )
    : registrations;

  const myAttendance = user
    ? attendance.filter(
        (item) => item.email === user.email
      )
    : attendance;

  dashboardEvents.textContent = events.length;
  dashboardRegistrations.textContent =
    myRegistrations.length;
  dashboardCertificates.textContent =
    myAttendance.length;
  // FORUM ADMIN DASHBOARD RESTRICTIONS
if (user?.role === "forum-admin") {

  if (dashboardRegistrations) {
    dashboardRegistrations.parentElement.style.display = "none";
  }

  if (dashboardCertificates) {
    dashboardCertificates.parentElement.style.display = "none";
  }
}
  if (dashboardNotices) {
    dashboardNotices.textContent =
      notices.length;
  }

  // EVENTS
  if (dashboardEventsList) {
    dashboardEventsList.innerHTML = "";

    if (events.length === 0) {
      dashboardEventsList.innerHTML =
        "<p>No events posted yet.</p>";
    }

    events.slice(0, 3).forEach((event) => {
      dashboardEventsList.innerHTML += `
        <div class="event-item">
          <div class="event-img purple">
            ${event.category
              .slice(0, 3)
              .toUpperCase()}
          </div>

          <div>
            <h3>${event.title}</h3>
            <p>${event.date} • ${event.venue}</p>
            <small>${event.description}</small>
          </div>

          <a href="event-details.html?id=${event._id}" class="view-btn">
            View
          </a>
        </div>
      `;
    });
  }

  // NOTICES
  if (dashboardNoticesList) {
    dashboardNoticesList.innerHTML = "";

    if (notices.length === 0) {
      dashboardNoticesList.innerHTML =
        "<p>No notices available.</p>";
    }

    notices.slice(0, 3).forEach((notice) => {
      dashboardNoticesList.innerHTML += `
        <div class="notice">
          <span>📄</span>
          <p>
            <strong>${notice.title}</strong><br>
            ${notice.department} • ${notice.category}
          </p>
          <small>New</small>
        </div>
      `;
    });
  }
}
// ROLE-BASED SIDEBAR

const dashboardLink = document.getElementById("dashboardLink");
const eventsLink = document.getElementById("eventsLink");
const noticesLink = document.getElementById("noticesLink");
const registrationsLink = document.getElementById("registrationsLink");
const manageEventsLink = document.getElementById("manageEventsLink");
const createEventLink = document.getElementById("createEventLink");
const adminDashboardLink = document.getElementById("adminDashboardLink");
const attendanceLink = document.getElementById("attendanceLink");
const certificatesLink = document.getElementById("certificatesLink");

if (user) {

  // STUDENT
  if (user.role === "student") {

    if (manageEventsLink) manageEventsLink.style.display = "none";
    if (createEventLink) createEventLink.style.display = "none";
    if (adminDashboardLink) adminDashboardLink.style.display = "none";
    if (attendanceLink) attendanceLink.style.display = "none";
  }

  // FORUM ADMIN
  if (user.role === "forum-admin") {

    if (eventsLink) eventsLink.style.display = "none";
    if (registrationsLink) registrationsLink.style.display = "none";
    if (adminDashboardLink) adminDashboardLink.style.display = "none";
    if (certificatesLink) certificatesLink.style.display = "none";
  }

  // COLLEGE ADMIN
  if (user.role === "college-admin") {

    if (eventsLink) eventsLink.style.display = "none";
    if (registrationsLink) registrationsLink.style.display = "none";
    if (manageEventsLink) manageEventsLink.style.display = "none";
    if (createEventLink) createEventLink.style.display = "none";
    if (certificatesLink) certificatesLink.style.display = "none";
  }
}

// CERTIFICATE PAGE
const studentName = document.getElementById("studentName");
const eventName = document.getElementById("eventName");

if (studentName && eventName) {
  const params = new URLSearchParams(window.location.search);

  const name = params.get("name");
  const event = params.get("event");

  studentName.textContent = name || "Student Name";
  eventName.textContent = event || "Event Name";
}

// CERTIFICATES PAGE
const certificatesList = document.getElementById("certificatesList");

if (certificatesList) {
  loadCertificates();
}

async function loadCertificates() {
  const attendance = await (
    await fetch(`${API}/attendance`)
  ).json();

  certificatesList.innerHTML = "";

  const myCertificates = attendance.filter(
    (item) => item.email === user?.email
  );

  if (myCertificates.length === 0) {
    certificatesList.innerHTML = `
      <div class="notice">
        <p>No certificates available yet.</p>
      </div>
    `;
    return;
  }

  myCertificates.forEach((item) => {
    certificatesList.innerHTML += `
      <div class="event-item">
        <div class="event-img purple">🏅</div>

        <div>
          <h3>${item.eventId?.title || "Event"}</h3>
          <p>Certificate Available</p>
        </div>

        <a
          href="certificate.html?name=${encodeURIComponent(
            item.studentName
          )}&event=${encodeURIComponent(
            item.eventId?.title || "Event"
          )}"
          class="view-btn"
        >
          View Certificate
        </a>
      </div>
    `;
  });
}