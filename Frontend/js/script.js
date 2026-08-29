const API = "https://campuspulse-yrrx.onrender.com/api";
// LOGIN CHECK
const user = JSON.parse(localStorage.getItem("user"));

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (user && user.token) {
    headers["Authorization"] = `Bearer ${user.token}`;
  }
  return headers;
}
const currentPage = window.location.pathname;
const currentFile = currentPage.split("/").pop();
const welcomeUser = document.getElementById("welcomeUser");

if (welcomeUser && user) {
  welcomeUser.textContent = `Welcome, ${user.fullName}`;
}

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
      "certificates.html",
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

    try {
      const response = await fetch(`${API}/events`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(eventData),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        alert("Event created successfully!");
        eventForm.reset();
      } else {
        alert(result.message || "Failed to create event");
      }
    } catch (err) {
      alert("Network error: Failed to create event");
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

          <span>${event.date}</span>
<span>${event.time}</span>
<span>${event.venue}</span>
          <div class="event-footer">

  <span class="event-fee">
    ₹${event.fee}
  </span>

  <a href="event-details.html?id=${event._id}" class="view-btn">
    View Details
  </a>

</div>
        </div>
      </div>
    `;
  });
}

// SEARCH + FILTER

const searchInput = document.getElementById("searchInput");
const departmentFilter = document.getElementById("departmentFilter");

let selectedCategory = "All";

function filterEvents(category = selectedCategory) {
  selectedCategory = category;

  // Toggle active class on category buttons
  document.querySelectorAll(".filter-tabs button").forEach((btn) => {
    if (btn.textContent.trim().toLowerCase() === category.toLowerCase()) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  let filtered = [...allEvents];

  const searchText = searchInput?.value.trim().toLowerCase() || "";
  const selectedDepartment = departmentFilter?.value || "All";

  // SEARCH
  if (searchText) {
    filtered = filtered.filter((event) => {
      return (
        (event.title || "").toLowerCase().includes(searchText) ||
        (event.description || "").toLowerCase().includes(searchText) ||
        (event.category || "").toLowerCase().includes(searchText) ||
        (event.organizer || "").toLowerCase().includes(searchText) ||
        (event.venue || "").toLowerCase().includes(searchText)
      );
    });
  }

  // CATEGORY BUTTON FILTER
  if (selectedCategory !== "All") {
    filtered = filtered.filter(
      (event) =>
        (event.category || "").toLowerCase() ===
        selectedCategory.toLowerCase()
    );
  }

  // DEPARTMENT FILTER
  if (selectedDepartment !== "All") {
    filtered = filtered.filter(
      (event) =>
        (event.organizer || "").toLowerCase() ===
        selectedDepartment.toLowerCase()
    );
  }

  displayEvents(filtered);
}

// SEARCH EVENT
if (searchInput) {
  searchInput.addEventListener("input", () => {
    filterEvents();
  });
}

// DEPARTMENT DROPDOWN
if (departmentFilter) {
  departmentFilter.addEventListener("change", () => {
    filterEvents();
  });
}


// EVENT DETAILS PAGE
const urlParams = new URLSearchParams(window.location.search);
const currentEventId = urlParams.get("id");

if (currentEventId && document.getElementById("eventTitle")) {
  loadEventDetails();
}

async function loadEventDetails() {
  try {
    const response = await fetch(`${API}/events/${currentEventId}`);
    const event = await response.json();

    document.getElementById("eventCategory").textContent = event.category || "Event";
    document.getElementById("eventTitle").textContent = event.title || "Event Title";
    document.getElementById("eventDescription").textContent = event.description || "";
    document.getElementById("eventAbout").textContent = event.description || "";
    document.getElementById("eventDate").textContent = event.date || "";
    document.getElementById("eventTime").textContent = event.time || "";
    document.getElementById("eventVenue").textContent = event.venue || "";
    document.getElementById("eventFee").textContent = `₹${event.fee || 0}`;
    document.getElementById("eventOrganizer").textContent = event.organizer || "";

    document.getElementById("eventShort").textContent =
      (event.category || "EVT").slice(0, 3).toUpperCase();

  } catch (error) {
    console.log(error);
    alert("Failed to load event details");
  }
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

    try {
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
          headers: getAuthHeaders(),
          body: JSON.stringify({
            amount: amount,
          }),
        }
      );

      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert(orderData.message || "Failed to create payment order");
        return;
      }

      const options = {
        key: orderData.key,
        amount: orderData.order.amount,
        currency: "INR",
        name: "CampusPulse",
        description: event.title,
        order_id: orderData.order.id,

        handler: async function (paymentResponse) {
          try {
            // Verify payment signature
            const verifyRes = await fetch(`${API}/payment/verify-payment`, {
              method: "POST",
              headers: getAuthHeaders(),
              body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (verifyData.success) {
              await saveRegistration(registrationData);
            } else {
              alert("Payment verification failed. Please contact support.");
            }
          } catch (err) {
            alert("Error verifying payment signature");
          }
        },

        prefill: {
          name: registrationData.studentName,
          email: registrationData.email,
        },

        theme: {
          color: "#003366",
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Registration/Payment Error:", err);
      alert("An error occurred during registration");
    }
  });
}

// SAVE REGISTRATION
async function saveRegistration(registrationData) {
  try {
    const response = await fetch(`${API}/registrations`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(registrationData),
    });

    const result = await response.json();

    if (response.ok) {
      alert("Registration Successful!");
      if (registrationForm) registrationForm.reset();
      window.location.href = "my-registrations.html";
    } else {
      alert(result.message || "Registration Failed");
    }
  } catch (err) {
    alert("Network error: Failed to save registration");
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
      const userData = { ...result.user };
      if (result.token) userData.token = result.token;
      localStorage.setItem("user", JSON.stringify(userData));

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

let allNotices = [];
let editingNoticeId = null;

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

    if (user && !user.token) {
      alert("Your session has expired. Please log out and log in again to post or edit notices.");
      window.location.href = "index.html";
      return;
    }

    try {
      let response;
      if (editingNoticeId) {
        // UPDATE EXISTING NOTICE
        response = await fetch(`${API}/notices/${editingNoticeId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(noticeData),
        });
      } else {
        // CREATE NEW NOTICE
        response = await fetch(`${API}/notices`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(noticeData),
        });
      }

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        alert(editingNoticeId ? "Notice updated successfully!" : "Notice posted successfully!");
        cancelNoticeEdit();
        loadNotices();
      } else {
        alert(result.message || (editingNoticeId ? "Failed to update notice" : "Failed to post notice"));
      }
    } catch (err) {
      alert("Network error: Failed to save notice");
    }
  });
}

if (noticesList) {
  loadNotices();
}

async function loadNotices() {
  try {
    const response = await fetch(`${API}/notices`);
    const notices = await response.json();

    noticesList.innerHTML = "";

    if (!Array.isArray(notices) || notices.length === 0) {
      noticesList.innerHTML = "<p>No notices available.</p>";
      allNotices = [];
      return;
    }

    allNotices = notices;

    notices.forEach((notice) => {
      noticesList.innerHTML += `
        <div class="notice">
          <span class="notice-icon">📢</span>

          <div class="notice-body">
            <strong style="color: var(--primary); font-size: 16px;">${notice.title}</strong>
            <p style="color: #64748b; font-size: 13px; margin: 3px 0 6px 0;">${notice.department} • ${notice.category}</p>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">${notice.description}</p>

            ${
              user?.role !== "student"
                ? `
                  <div class="notice-actions" style="margin-top: 12px; display: flex; gap: 8px;">
                    <button
                      type="button"
                      class="edit-btn"
                      onclick="editNotice('${notice._id}')"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      class="delete-btn"
                      onclick="deleteNotice('${notice._id}')"
                    >
                      Delete
                    </button>
                  </div>
                `
                : ""
            }
          </div>

          <small>New</small>
        </div>
      `;
    });
  } catch (err) {
    console.error("Failed to load notices:", err);
  }
}

function editNotice(id) {
  const notice = allNotices.find((n) => n._id === id);
  if (!notice || !noticeForm) return;

  editingNoticeId = id;

  const titleInput = noticeForm.querySelector('[name="title"]');
  const categorySelect = noticeForm.querySelector('[name="category"]');
  const departmentInput = noticeForm.querySelector('[name="department"]');
  const descriptionTextarea = noticeForm.querySelector('[name="description"]');
  const submitBtn = noticeForm.querySelector('button[type="submit"]');

  if (titleInput) titleInput.value = notice.title || "";
  if (categorySelect) categorySelect.value = notice.category || "";
  if (departmentInput) departmentInput.value = notice.department || "";
  if (descriptionTextarea) descriptionTextarea.value = notice.description || "";

  if (submitBtn) submitBtn.textContent = "Update Notice";

  let cancelBtn = document.getElementById("cancelNoticeEditBtn");
  if (!cancelBtn) {
    cancelBtn = document.createElement("button");
    cancelBtn.id = "cancelNoticeEditBtn";
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel Edit";
    cancelBtn.style.cssText = "background: #6c757d; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-left: 10px;";
    cancelBtn.onclick = cancelNoticeEdit;
    submitBtn.parentElement.appendChild(cancelBtn);
  }

  if (noticePostSection) {
    noticePostSection.scrollIntoView({ behavior: "smooth" });
  }
}

function cancelNoticeEdit() {
  editingNoticeId = null;
  if (!noticeForm) return;

  noticeForm.reset();
  const submitBtn = noticeForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Post Notice";

  const cancelBtn = document.getElementById("cancelNoticeEditBtn");
  if (cancelBtn) cancelBtn.remove();
}

async function deleteNotice(id) {
  if (!confirm("Delete this notice?")) return;

  try {
    const response = await fetch(`${API}/notices/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      alert("Notice deleted successfully");
      loadNotices();
    } else {
      alert(result.message || "Failed to delete notice");
    }
  } catch (err) {
    alert("Network error: Failed to delete notice");
  }
}
// MANAGE EVENTS PAGE
const manageEventsList = document.getElementById("manageEventsList");

// MANAGE EVENTS
const manageEventsSearchInput = document.getElementById("manageEventsSearchInput");
let allManageEvents = [];
let allManageRegistrations = [];
let selectedManageCategory = "All";

if (manageEventsList) {
  loadManageEvents();

  if (manageEventsSearchInput) {
    manageEventsSearchInput.addEventListener("input", () => {
      renderManageEvents();
    });
  }
}

async function loadManageEvents() {
  try {
    const [eventsRes, regsRes] = await Promise.allSettled([
      fetch(`${API}/events`).then((r) => r.json()),
      fetch(`${API}/registrations`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ]);

    if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value)) {
      allManageEvents = eventsRes.value;
    } else {
      allManageEvents = [];
    }

    if (regsRes.status === "fulfilled" && Array.isArray(regsRes.value)) {
      allManageRegistrations = regsRes.value;
    } else {
      allManageRegistrations = [];
    }

    renderManageEvents();
  } catch (err) {
    console.error("Failed to load manage events:", err);
  }
}

function filterManageEvents(category) {
  selectedManageCategory = category;

  document.querySelectorAll(".filter-tabs button").forEach((btn) => {
    if (btn.textContent.trim().toLowerCase() === category.toLowerCase()) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  renderManageEvents();
}

function renderManageEvents() {
  if (!manageEventsList) return;

  manageEventsList.innerHTML = "";

  const searchText = manageEventsSearchInput?.value.trim().toLowerCase() || "";

  let filtered = allManageEvents;

  if (selectedManageCategory !== "All") {
    filtered = filtered.filter(
      (ev) => (ev.category || "").toLowerCase() === selectedManageCategory.toLowerCase()
    );
  }

  if (searchText) {
    filtered = filtered.filter((ev) => {
      const title = (ev.title || "").toLowerCase();
      const org = (ev.organizer || "").toLowerCase();
      const venue = (ev.venue || "").toLowerCase();
      const cat = (ev.category || "").toLowerCase();
      return (
        title.includes(searchText) ||
        org.includes(searchText) ||
        venue.includes(searchText) ||
        cat.includes(searchText)
      );
    });
  }

  if (filtered.length === 0) {
    manageEventsList.innerHTML = "<p style='color: #64748b; padding: 14px 0;'>No events found.</p>";
    return;
  }

  const countsByEventId = {};
  allManageRegistrations.forEach((reg) => {
    const evId = reg.eventId?._id || reg.eventId || "unknown";
    countsByEventId[evId] = (countsByEventId[evId] || 0) + 1;
  });

  filtered.forEach((event) => {
    const regCount = countsByEventId[event._id] || 0;
    const catShort = (event.category || "EVT").slice(0, 3).toUpperCase();

    manageEventsList.innerHTML += `
      <div class="event-item" style="grid-template-columns: 70px 1fr auto; gap: 18px; align-items: center; padding: 18px 0;">
        <div class="event-img" style="width: 70px; height: 65px; border-radius: 12px; font-weight: 800; font-size: 15px;">
          ${catShort}
        </div>

        <div>
          <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <h3 style="margin: 0; color: var(--primary); font-size: 17px;">${event.title}</h3>
            <span class="participant-count-badge" style="font-size: 11.5px; padding: 3px 9px;">${regCount} Registered</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin: 4px 0;">${event.organizer} • ${event.category}</p>
          <small style="color: #94a3b8; font-size: 12.5px;">📅 ${event.date} • ⏰ ${event.time || "TBA"} • 📍 ${event.venue} • 💳 ₹${event.fee || 0}</small>
        </div>

        <div class="manage-actions" style="display: flex; gap: 8px; flex-wrap: wrap;">
          <button type="button" class="edit-btn" onclick="editEvent('${event._id}')">Edit</button>
          <button type="button" style="background: #0d9488; color: white;" onclick="openAttendance('${event._id}')">Attendance</button>
          <button type="button" style="background: var(--primary); color: white;" onclick="downloadParticipants('${event.title.replace(/'/g, "\\'")}')">CSV</button>
          <button type="button" class="delete-btn" onclick="deleteEvent('${event._id}')">Delete</button>
        </div>
      </div>
    `;
  });
}

function editEvent(id) {
  window.location.href = `edit-event.html?id=${id}`;
}

function openAttendance(id) {
  window.location.href = `mark-attendance.html?id=${id}`;
}

async function deleteEvent(id) {
  const confirmDelete = confirm("Are you sure you want to delete this event?");

  if (!confirmDelete) return;

  try {
    const response = await fetch(`${API}/events/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (response.ok) {
      alert("Event deleted successfully");
      loadManageEvents();
    } else {
      alert(result.message || "Failed to delete event");
    }
  } catch (err) {
    alert("Network error: Failed to delete event");
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

    try {
      const response = await fetch(`${API}/events/${id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatedData),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        alert("Event updated successfully!");
        window.location.href = "manage-events.html";
      } else {
        alert(result.message || "Failed to update event");
      }
    } catch (err) {
      alert("Network error: Failed to update event");
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
const registrationStatLabel = document.getElementById("registrationStatLabel");
const registrationsSectionTitle = document.getElementById("registrationsSectionTitle");
const registrationsList = document.getElementById("registrationsList");
const eventStats = document.getElementById("eventStats");
const adminEventSelect = document.getElementById("adminEventSelect");
const adminSearchInput = document.getElementById("adminSearchInput");

let allAdminEvents = [];
let allAdminRegistrations = [];

if (totalEvents && totalRegistrations && registrationsList) {
  loadAdminDashboard();

  if (adminEventSelect) {
    adminEventSelect.addEventListener("change", () => {
      renderAdminDashboardData();
    });
  }

  if (adminSearchInput) {
    adminSearchInput.addEventListener("input", () => {
      renderAdminDashboardData();
    });
  }
}

async function loadAdminDashboard() {
  const adminPageHeading = document.getElementById("adminPageHeading");
  const adminPageSubheading = document.getElementById("adminPageSubheading");

  if (user?.role === "forum-admin") {
    if (adminPageHeading) adminPageHeading.textContent = "Event Analytics & Reports";
    if (adminPageSubheading) adminPageSubheading.textContent = "Track forum event registrations, participants, and reports.";
    document.title = "CampusPulse | Event Analytics";
  } else {
    if (adminPageHeading) adminPageHeading.textContent = "Admin Dashboard";
    if (adminPageSubheading) adminPageSubheading.textContent = "Track college events, registrations, and reports.";
    document.title = "CampusPulse | Admin Dashboard";
  }

  try {
    const [eventsRes, regsRes] = await Promise.allSettled([
      fetch(`${API}/events`).then((r) => r.json()),
      fetch(`${API}/registrations`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ]);

    if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value)) {
      allAdminEvents = eventsRes.value;
    } else {
      allAdminEvents = [];
    }

    if (regsRes.status === "fulfilled" && Array.isArray(regsRes.value)) {
      allAdminRegistrations = regsRes.value;
    } else {
      allAdminRegistrations = [];
    }

    populateAdminEventDropdown();
    renderAdminDashboardData();
  } catch (err) {
    console.error("Admin dashboard fetch error:", err);
  }
}

function populateAdminEventDropdown() {
  if (!adminEventSelect) return;

  const currentVal = adminEventSelect.value || "All";
  adminEventSelect.innerHTML = `<option value="All">📌 All Events Overview (${allAdminRegistrations.length} Total)</option>`;

  // Map counts per event
  const countsByEventId = {};
  allAdminRegistrations.forEach((reg) => {
    const evId = reg.eventId?._id || reg.eventId || "unknown";
    countsByEventId[evId] = (countsByEventId[evId] || 0) + 1;
  });

  allAdminEvents.forEach((ev) => {
    const count = countsByEventId[ev._id] || 0;
    const opt = document.createElement("option");
    opt.value = ev._id;
    opt.textContent = `🎯 ${ev.title} (${count} Registered)`;
    if (ev._id === currentVal) opt.selected = true;
    adminEventSelect.appendChild(opt);
  });
}

function selectAdminEvent(eventId) {
  if (adminEventSelect) {
    adminEventSelect.value = eventId;
    renderAdminDashboardData();
    const panel = document.getElementById("registrationsSectionTitle");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth" });
    }
  }
}

function renderAdminDashboardData() {
  const selectedEventId = adminEventSelect?.value || "All";
  const query = adminSearchInput?.value.trim().toLowerCase() || "";

  if (totalEvents) {
    totalEvents.textContent = allAdminEvents.length;
  }

  // Filter registrations by selected event
  let eventFilteredRegs = allAdminRegistrations;
  let currentEventName = "All Events";

  if (selectedEventId !== "All") {
    const selectedEvent = allAdminEvents.find((e) => e._id === selectedEventId);
    currentEventName = selectedEvent ? selectedEvent.title : "Selected Event";

    eventFilteredRegs = allAdminRegistrations.filter((reg) => {
      const evId = reg.eventId?._id || reg.eventId || "";
      return evId === selectedEventId;
    });

    if (registrationStatLabel) {
      registrationStatLabel.textContent = `Registrations: ${currentEventName}`;
    }
    if (registrationsSectionTitle) {
      registrationsSectionTitle.textContent = `Registered Students for "${currentEventName}" (${eventFilteredRegs.length})`;
    }
  } else {
    if (registrationStatLabel) {
      registrationStatLabel.textContent = "Total Registrations (All Events)";
    }
    if (registrationsSectionTitle) {
      registrationsSectionTitle.textContent = `All Registered Students (${allAdminRegistrations.length})`;
    }
  }

  // Set the total registration number for this event
  if (totalRegistrations) {
    totalRegistrations.textContent = eventFilteredRegs.length;
  }

  // Filter by search query
  let displayRegs = eventFilteredRegs;
  if (query) {
    displayRegs = eventFilteredRegs.filter((reg) => {
      const sName = (reg.studentName || "").toLowerCase();
      const sEmail = (reg.email || "").toLowerCase();
      const sBranch = (reg.branch || "").toLowerCase();
      const evTitle = (reg.eventId?.title || "").toLowerCase();
      return (
        sName.includes(query) ||
        sEmail.includes(query) ||
        sBranch.includes(query) ||
        evTitle.includes(query)
      );
    });
  }

  // Render registrations list
  if (registrationsList) {
    registrationsList.innerHTML = "";

    if (displayRegs.length === 0) {
      registrationsList.innerHTML = `<p style="color: #64748b; padding: 14px 0;">No registrations found for ${currentEventName}.</p>`;
    } else {
      displayRegs.forEach((reg) => {
        const initials = (reg.studentName || "U")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        registrationsList.innerHTML += `
          <div class="registration-row">
            <div class="reg-user-info">
              <div class="reg-avatar">${initials}</div>
              <div class="reg-details">
                <h4>${reg.studentName || "Student"}</h4>
                <p>${reg.branch || "Branch"} • ${reg.year || "Year"}</p>
                <span class="reg-event-badge">Event: ${reg.eventId?.title || currentEventName}</span>
              </div>
            </div>
            <div class="reg-email-tag">
              ${reg.email || ""}
            </div>
          </div>
        `;
      });
    }
  }

  // Render Event Statistics Cards
  if (eventStats) {
    const eventCounts = {};

    allAdminRegistrations.forEach((reg) => {
      const title = reg.eventId?.title || "Unknown Event";
      eventCounts[title] = (eventCounts[title] || 0) + 1;
    });

    eventStats.innerHTML = "";

    if (allAdminEvents.length === 0) {
      eventStats.innerHTML = "<p style='color: #64748b; padding: 12px 0;'>No events available.</p>";
    } else {
      allAdminEvents.forEach((ev) => {
        const count = eventCounts[ev.title] || 0;
        const isCurrentlySelected = selectedEventId === ev._id;

        eventStats.innerHTML += `
          <div class="event-stat-card" style="${isCurrentlySelected ? 'border: 2px solid var(--primary); background: #ffffff;' : ''}">
            <div class="event-stat-header">
              <div>
                <h3>${ev.title}</h3>
                <p style="font-size: 13px; color: #64748b; margin-top: 3px;">${ev.date || ""} • ${ev.venue || ""}</p>
              </div>
              <span class="participant-count-badge">${count} Registered</span>
            </div>
            <div style="display: flex; gap: 8px; margin-top: 10px;">
              <button type="button" class="edit-btn" style="flex: 1; padding: 9px 12px; font-size: 12.5px;" onclick="selectAdminEvent('${ev._id}')">
                ${isCurrentlySelected ? "✓ Currently Viewing" : "View Students"}
              </button>
              <button type="button" style="flex: 1; padding: 9px 12px; font-size: 12.5px; background: var(--primary);" onclick="downloadParticipants('${ev.title.replace(/'/g, "\\'")}')">
                Download CSV
              </button>
            </div>
          </div>
        `;
      });
    }
  }
}

async function downloadParticipants(eventName) {
  try {
    const res = await fetch(`${API}/registrations`, { headers: getAuthHeaders() });
    const registrations = await res.json();

    if (!Array.isArray(registrations)) {
      alert("Failed to download participants data");
      return;
    }

    const filtered = registrations.filter(
      (reg) => (reg.eventId?.title || "Unknown Event") === eventName
    );

    let csv = "Name,Email,Branch,Year\n";

    filtered.forEach((reg) => {
      csv += `"${reg.studentName || ""}","${reg.email || ""}","${reg.branch || ""}","${reg.year || ""}"\n`;
    });

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${eventName.replace(/[^a-zA-Z0-9_-]/g, "_")}-participants.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    window.URL.revokeObjectURL(url);
  } catch (err) {
    alert("Error generating CSV export");
  }
}

// MY REGISTRATIONS
const myRegistrationsList = document.getElementById("myRegistrationsList");

if (myRegistrationsList) {
  loadMyRegistrations();
}

async function loadMyRegistrations() {
  try {
    const [regsRes, attRes] = await Promise.allSettled([
      fetch(`${API}/registrations`, { headers: getAuthHeaders() }).then((r) => r.json()),
      fetch(`${API}/attendance`, { headers: getAuthHeaders() }).then((r) => r.json()),
    ]);

    const registrations = regsRes.status === "fulfilled" && Array.isArray(regsRes.value) ? regsRes.value : [];
    const attendance = attRes.status === "fulfilled" && Array.isArray(attRes.value) ? attRes.value : [];

    myRegistrationsList.innerHTML = "";

    const userEmail = (user?.email || "").trim().toLowerCase();

    const userRegistrations = user
      ? registrations.filter((reg) => (reg.email || "").trim().toLowerCase() === userEmail)
      : registrations;

    const userAttendance = user
      ? attendance.filter((att) => (att.email || "").trim().toLowerCase() === userEmail)
      : attendance;

    const attendedEventIds = new Set(
      userAttendance
        .map((item) => {
          if (!item.eventId) return "";
          return typeof item.eventId === "object" ? item.eventId._id : item.eventId;
        })
        .filter(Boolean)
    );

    if (userRegistrations.length === 0) {
      myRegistrationsList.innerHTML = "<p style='color: #64748b; padding: 14px 0;'>No event registrations found.</p>";
      return;
    }

    userRegistrations.forEach((reg) => {
      const evId = typeof reg.eventId === "object" ? reg.eventId?._id : reg.eventId;
      const isAttended = attendedEventIds.has(evId);

      myRegistrationsList.innerHTML += `
        <div class="event-item" style="grid-template-columns: 70px 1fr auto; gap: 16px; align-items: center;">
          <div class="event-img" style="background: ${isAttended ? '#059669' : '#003366'}; color: white; width: 65px; height: 60px; border-radius: 12px; font-size: 16px; font-weight: 800;">
            ${isAttended ? "✓" : "REG"}
          </div>

          <div>
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <h3 style="margin: 0; color: var(--primary);">${reg.eventId?.title || "Event"}</h3>
              <span style="font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 999px; background: ${isAttended ? '#ecfdf5' : '#eff6ff'}; color: ${isAttended ? '#059669' : '#003366'}; border: 1px solid ${isAttended ? '#a7f3d0' : '#bfdbfe'};">
                ${isAttended ? "✅ Attended" : "📌 Registered (Upcoming)"}
              </span>
            </div>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0;">${reg.eventId?.organizer || "Organizer"}</p>
            <small style="color: #94a3b8; font-size: 12.5px;">📅 ${reg.eventId?.date || ""} • 📍 ${reg.eventId?.venue || ""}</small>
          </div>

          <div>
            ${
              isAttended
                ? `<a href="certificates.html" style="display: inline-block; padding: 9px 16px; font-size: 13px; font-weight: 700; background: #059669; color: white; border-radius: 8px; text-decoration: none;">Get Certificate 🎓</a>`
                : `<button type="button" style="background: var(--primary); color: white; padding: 9px 16px; font-size: 13px; font-weight: 700; border-radius: 8px;" disabled>Registered</button>`
            }
          </div>
        </div>
      `;
    });
  } catch (err) {
    console.error("Failed to load my registrations:", err);
  }
}

// MARK ATTENDANCE
const attendanceForm = document.getElementById("attendanceForm");
const eventBannerCategory = document.getElementById("eventBannerCategory");
const eventBannerTitle = document.getElementById("eventBannerTitle");
const eventBannerMeta = document.getElementById("eventBannerMeta");
const attendanceAlert = document.getElementById("attendanceAlert");
const backLink = document.getElementById("backLink");

if (attendanceForm) {
  const currentEventId = new URLSearchParams(window.location.search).get("id");

  // Customize back link based on user role
  if (backLink && user?.role === "college-admin") {
    backLink.href = "attendance.html";
    backLink.textContent = "← Back to Attendance Records";
  }

  // Load event details for the banner
  if (currentEventId) {
    fetch(`${API}/events/${currentEventId}`)
      .then((r) => r.json())
      .then((event) => {
        if (event && event.title) {
          if (eventBannerTitle) eventBannerTitle.textContent = event.title;
          if (eventBannerCategory) eventBannerCategory.textContent = event.category || "EVENT";
          if (eventBannerMeta) {
            eventBannerMeta.textContent = `📅 ${event.date || "Date TBA"} • 📍 ${event.venue || "Venue"}`;
          }
        }
      })
      .catch(() => {});
  }

  attendanceForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData(attendanceForm);
    const email = formData.get("email")?.trim().toLowerCase();

    if (!email) return;

    if (attendanceAlert) {
      attendanceAlert.style.display = "none";
    }

    try {
      const regRes = await fetch(`${API}/registrations`, { headers: getAuthHeaders() });
      const registrations = await regRes.json();

      if (!Array.isArray(registrations)) {
        alert("Failed to load registration data. Please try again.");
        return;
      }

      const student = registrations.find(
        (reg) => (reg.email || "").toLowerCase() === email && ((reg.eventId?._id || reg.eventId) === currentEventId)
      );

      if (!student) {
        if (attendanceAlert) {
          attendanceAlert.style.display = "block";
          attendanceAlert.style.background = "#fef2f2";
          attendanceAlert.style.border = "1.5px solid #fecaca";
          attendanceAlert.style.color = "#dc2626";
          attendanceAlert.textContent = "❌ Student with this email is not registered for this event.";
        } else {
          alert("Student is not registered for this event.");
        }
        return;
      }

      const attendanceData = {
        eventId: currentEventId,
        studentName: student.studentName,
        email: student.email,
        branch: student.branch,
        year: student.year,
      };

      const response = await fetch(`${API}/attendance`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(attendanceData),
      });

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        if (attendanceAlert) {
          attendanceAlert.style.display = "block";
          attendanceAlert.style.background = "#f0fdf4";
          attendanceAlert.style.border = "1.5px solid #bbf7d0";
          attendanceAlert.style.color = "#16a34a";
          attendanceAlert.innerHTML = `✅ Attendance Marked for <strong>${student.studentName}</strong> (${student.branch} • ${student.year})!`;
        } else {
          alert("Attendance marked successfully!");
        }
        attendanceForm.reset();
        const input = document.getElementById("attendanceEmailInput");
        if (input) input.focus();
      } else {
        if (attendanceAlert) {
          attendanceAlert.style.display = "block";
          attendanceAlert.style.background = "#fffbeb";
          attendanceAlert.style.border = "1.5px solid #fde68a";
          attendanceAlert.style.color = "#d97706";
          attendanceAlert.textContent = `⚠️ ${result.message || "Attendance failed or already marked."}`;
        } else {
          alert(result.message || "Attendance failed");
        }
      }
    } catch (err) {
      alert("Network error: Failed to mark attendance");
    }
  });
}
// ATTENDANCE BUTTON
const attendanceBtn = document.getElementById("attendanceBtn");

if (attendanceBtn && user?.role === "student") {
  attendanceBtn.style.display = "none";
}


// ATTENDANCE LIST (GROUPED & DROPDOWN ACCORDIONS)
const attendanceList = document.getElementById("attendanceList");
const attendanceSearchInput = document.getElementById("attendanceSearchInput");
const eventAttendanceSelect = document.getElementById("eventAttendanceSelect");

let allAttendanceRecords = [];

if (attendanceList) {
  loadAttendance();

  if (attendanceSearchInput) {
    attendanceSearchInput.addEventListener("input", () => {
      renderGroupedAttendance();
    });
  }

  if (eventAttendanceSelect) {
    eventAttendanceSelect.addEventListener("change", () => {
      renderGroupedAttendance();
    });
  }
}

async function loadAttendance() {
  try {
    const res = await fetch(`${API}/attendance`, { headers: getAuthHeaders() });
    const attendance = await res.json();

    if (!Array.isArray(attendance)) {
      allAttendanceRecords = [];
    } else {
      allAttendanceRecords = attendance;
    }

    populateEventDropdown();
    renderGroupedAttendance();
  } catch (err) {
    console.error("Failed to load attendance:", err);
  }
}

function populateEventDropdown() {
  if (!eventAttendanceSelect) return;

  const currentVal = eventAttendanceSelect.value || "All";
  eventAttendanceSelect.innerHTML = `<option value="All">📌 All Events (Dropdown)</option>`;

  const uniqueEvents = {};
  allAttendanceRecords.forEach((item) => {
    const eventId = item.eventId?._id || item.eventId || "other";
    const eventTitle = item.eventId?.title || "Event Attendance";
    if (!uniqueEvents[eventId]) {
      uniqueEvents[eventId] = { id: eventId, title: eventTitle, count: 0 };
    }
    uniqueEvents[eventId].count += 1;
  });

  for (const id in uniqueEvents) {
    const ev = uniqueEvents[id];
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = `🎯 ${ev.title} (${ev.count} Present)`;
    if (id === currentVal) opt.selected = true;
    eventAttendanceSelect.appendChild(opt);
  }
}

function renderGroupedAttendance() {
  if (!attendanceList) return;

  attendanceList.innerHTML = "";

  const query = attendanceSearchInput?.value.trim().toLowerCase() || "";
  const selectedEventId = eventAttendanceSelect?.value || "All";

  let filtered = allAttendanceRecords;

  // Filter by selected event dropdown
  if (selectedEventId !== "All") {
    filtered = filtered.filter((item) => {
      const id = item.eventId?._id || item.eventId || "other";
      return id === selectedEventId;
    });
  }

  // Filter by search query
  if (query) {
    filtered = filtered.filter((item) => {
      const eventTitle = (item.eventId?.title || "").toLowerCase();
      const studentName = (item.studentName || "").toLowerCase();
      const email = (item.email || "").toLowerCase();
      const branch = (item.branch || "").toLowerCase();
      return (
        eventTitle.includes(query) ||
        studentName.includes(query) ||
        email.includes(query) ||
        branch.includes(query)
      );
    });
  }

  if (filtered.length === 0) {
    attendanceList.innerHTML = `
      <div class="panel">
        <p style="color: #64748b; padding: 12px 0;">No attendance records found for this selection.</p>
      </div>
    `;
    return;
  }

  // GROUP BY EVENT
  const grouped = {};
  filtered.forEach((item) => {
    const eventId = item.eventId?._id || item.eventId || "other";
    const eventTitle = item.eventId?.title || "Event Attendance";
    const eventDate = item.eventId?.date || "";
    const eventVenue = item.eventId?.venue || "";
    const eventCategory = item.eventId?.category || "";

    if (!grouped[eventId]) {
      grouped[eventId] = {
        id: eventId,
        title: eventTitle,
        date: eventDate,
        venue: eventVenue,
        category: eventCategory,
        attendees: [],
      };
    }

    grouped[eventId].attendees.push(item);
  });

  for (const eventId in grouped) {
    const group = grouped[eventId];
    const count = group.attendees.length;

    const attendeesHtml = group.attendees
      .map((attendee) => {
        const initials = (attendee.studentName || "U")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();

        return `
          <div class="attendee-item">
            <div class="attendee-user">
              <div class="attendee-avatar">${initials}</div>
              <div>
                <strong>${attendee.studentName}</strong>
                <p>${attendee.branch} • ${attendee.year}</p>
              </div>
            </div>
            <div class="attendee-email">${attendee.email}</div>
            <span class="status-present-pill">✅ Present</span>
          </div>
        `;
      })
      .join("");

    attendanceList.innerHTML += `
      <div class="event-attendance-group" id="group_${group.id}">
        <div class="event-attendance-header" onclick="toggleEventAttendance('${group.id}')" style="cursor: pointer;">
          <div>
            <h3 style="display: flex; align-items: center; gap: 8px;">
              <span id="chevron_${group.id}" class="chevron-icon">▼</span>
              ${group.title}
            </h3>
            <p class="event-attendance-meta" style="margin-left: 24px;">
              ${group.date ? `📅 ${group.date}` : ""} ${group.venue ? `• 📍 ${group.venue}` : ""} ${group.category ? `• 🏷️ ${group.category}` : ""}
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span class="attendance-count-badge">
              ${count} ${count === 1 ? "Student" : "Students"} Present
            </span>
            <span style="color: #64748b; font-size: 13px; font-weight: 600;">(Click to Toggle)</span>
          </div>
        </div>

        <div class="event-attendees-list" id="list_${group.id}">
          ${attendeesHtml}
        </div>
      </div>
    `;
  }
}

function toggleEventAttendance(eventId) {
  const listEl = document.getElementById(`list_${eventId}`);
  const chevronEl = document.getElementById(`chevron_${eventId}`);
  if (!listEl) return;

  if (listEl.style.display === "none") {
    listEl.style.display = "flex";
    if (chevronEl) chevronEl.textContent = "▼";
  } else {
    listEl.style.display = "none";
    if (chevronEl) chevronEl.textContent = "▶";
  }
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
      dashboardUserName.textContent = `Welcome, ${user.fullName}`;
    }

    if (welcomeText) {
      welcomeText.textContent = `Welcome back, ${user.fullName} 👋`;
    }
  }

  if (todayDate) {
    todayDate.textContent = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  let events = [];
  let registrations = [];
  let attendance = [];
  let notices = [];

  try {
    const authHeaders = (user && user.token) ? { Authorization: `Bearer ${user.token}` } : {};

    const [eventsRes, regsRes, attRes, noticesRes] = await Promise.allSettled([
      fetch(`${API}/events`).then((r) => r.json()),
      fetch(`${API}/registrations`, { headers: authHeaders }).then((r) => r.json()),
      fetch(`${API}/attendance`, { headers: authHeaders }).then((r) => r.json()),
      fetch(`${API}/notices`).then((r) => r.json()),
    ]);

    if (eventsRes.status === "fulfilled" && Array.isArray(eventsRes.value)) {
      events = eventsRes.value;
    }
    if (regsRes.status === "fulfilled" && Array.isArray(regsRes.value)) {
      registrations = regsRes.value;
    }
    if (attRes.status === "fulfilled" && Array.isArray(attRes.value)) {
      attendance = attRes.value;
    }
    if (noticesRes.status === "fulfilled" && Array.isArray(noticesRes.value)) {
      notices = noticesRes.value;
    }
  } catch (err) {
    console.error("Dashboard fetch error:", err);
  }

  const userEmail = (user?.email || "").trim().toLowerCase();

  const myRegistrations = user
    ? registrations.filter((reg) => (reg.email || "").trim().toLowerCase() === userEmail)
    : registrations;

  const myAttendance = user
    ? attendance.filter((item) => (item.email || "").trim().toLowerCase() === userEmail)
    : attendance;

  // Set of event IDs where student's attendance has been marked
  const attendedEventIds = new Set(
    myAttendance
      .map((item) => {
        if (!item.eventId) return "";
        return typeof item.eventId === "object" ? item.eventId._id : item.eventId;
      })
      .filter(Boolean)
  );

  // Active registrations (pending attendance)
  const pendingAttendanceRegistrations = myRegistrations.filter((reg) => {
    const evId = typeof reg.eventId === "object" ? reg.eventId?._id : reg.eventId;
    return !attendedEventIds.has(evId);
  });

  if (dashboardEvents) {
    dashboardEvents.textContent = events.length;
  }
  if (dashboardRegistrations) {
    dashboardRegistrations.textContent = pendingAttendanceRegistrations.length;
  }
  if (dashboardCertificates) {
    dashboardCertificates.textContent = myAttendance.length;
  }
  if (dashboardNotices) {
    dashboardNotices.textContent = notices.length;
  }

  // ADMIN DASHBOARD RESTRICTIONS (Forum Admin & College Admin)
  if (user?.role === "forum-admin" || user?.role === "college-admin") {
    if (dashboardRegistrations) {
      dashboardRegistrations.parentElement.style.display = "none";
    }

    if (dashboardCertificates) {
      dashboardCertificates.parentElement.style.display = "none";
    }
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

const manageEventsLink = document.getElementById("manageEventsLink");
const createEventLink = document.getElementById("createEventLink");
const adminDashboardLink = document.getElementById("adminDashboardLink");
const attendanceLink = document.getElementById("attendanceLink");
const eventsLink = document.getElementById("eventsLink");
const registrationsLink = document.getElementById("registrationsLink");
const certificatesLink = document.getElementById("certificatesLink");

function removeElement(element) {
  if (element) element.remove();
}

if (user) {
  if (user.role === "student") {
    removeElement(manageEventsLink);
    removeElement(createEventLink);
    removeElement(adminDashboardLink);
    removeElement(attendanceLink);
  }

  if (user.role === "forum-admin") {
    removeElement(eventsLink);
    removeElement(registrationsLink);
    removeElement(certificatesLink);
    if (adminDashboardLink) {
      adminDashboardLink.textContent = "Event Analytics";
    }
  }

  if (user.role === "college-admin") {
    removeElement(eventsLink);
    removeElement(registrationsLink);
    removeElement(manageEventsLink);
    removeElement(createEventLink);
    removeElement(certificatesLink);
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
  try {
    const res = await fetch(`${API}/attendance`, { headers: getAuthHeaders() });
    const attendance = await res.json();

    certificatesList.innerHTML = "";

    if (!Array.isArray(attendance)) {
      certificatesList.innerHTML = `
        <div class="notice">
          <p>No certificates available yet.</p>
        </div>
      `;
      return;
    }

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
  } catch (err) {
    console.error("Failed to load certificates:", err);
  }
}
function toggleMenu() {
  const sidebar = document.querySelector(".sidebar");
  if (sidebar) {
    sidebar.classList.toggle("show");
  }
}

// DYNAMIC ACTIVE LINK HIGHLIGHTING
document.addEventListener("DOMContentLoaded", () => {
  const currentFileName = window.location.pathname.split("/").pop();
  
  if (currentFileName) {
    document.querySelectorAll(".sidebar a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href && href === currentFileName) {
        link.classList.add("active");
      }
    });
  }

  // Highlight first category button on events page
  if (currentFileName === "events.html") {
    const allCategoryBtn = document.querySelector(".filter-tabs button");
    if (allCategoryBtn) {
      allCategoryBtn.classList.add("active");
    }
  }
});
