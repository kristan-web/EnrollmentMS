// Rooms page controller
// Talks to app/Rooms/Controller/room_controller.php

(function () {
  const CONTROLLER_URL = "../Controller/room_controller.php";

  const roomRows      = document.getElementById("roomRows");
  const emptyState     = document.getElementById("emptyState");
  const searchInput    = document.getElementById("searchInput");
  const searchClearBtn = document.querySelector(".search-clear");

  const addRoomBtn     = document.getElementById("addRoomBtn");
  const roomModal      = document.getElementById("roomModal");
  const roomModalTitle = document.getElementById("roomModalTitle");
  const closeRoomModal = document.getElementById("closeRoomModal");
  const cancelRoomBtn  = document.getElementById("cancelRoomBtn");
  const saveRoomBtn    = document.getElementById("saveRoomBtn");
  const roomMsg        = document.getElementById("roomMsg");

  const roomIdInput       = document.getElementById("roomId");
  const roomNameInput     = document.getElementById("roomName");
  const roomBuildingInput = document.getElementById("roomBuilding");
  const roomCapacityInput = document.getElementById("roomCapacity");

  const confirmModal      = document.getElementById("confirmModal");
  const confirmName       = document.getElementById("confirmName");
  const confirmActionBtn  = document.getElementById("confirmActionBtn");
  const closeConfirmModal = document.getElementById("closeConfirmModal");
  const cancelConfirmBtn  = document.getElementById("cancelConfirmBtn");

  let currentRooms = [];
  let pendingDeleteId = null;
  let searchDebounce = null;

  // ---------- Helpers ----------

  function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function openModal(modal) {
    modal.hidden = false;
  }

  function closeModal(modal) {
    modal.hidden = true;
  }

  // ---------- Rendering ----------

  function renderRooms(rooms) {
    roomRows.innerHTML = "";

    if (!rooms || rooms.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    rooms.forEach((room) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${escapeHtml(room.room_id)}</td>
        <td>${escapeHtml(room.room_name)}</td>
        <td>${escapeHtml(room.building)}</td>
        <td>${escapeHtml(room.capacity)}</td>
        <td class="no-print">
          <button type="button" class="btn btn--ghost btn--sm room-edit-btn" data-id="${room.room_id}">Edit</button>
          <button type="button" class="btn btn--danger btn--sm room-delete-btn" data-id="${room.room_id}">Delete</button>
        </td>
      `;
      roomRows.appendChild(tr);
    });

    roomRows.querySelectorAll(".room-edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => openEditModal(btn.dataset.id));
    });

    roomRows.querySelectorAll(".room-delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => openDeleteConfirm(btn.dataset.id));
    });
  }

  // ---------- Data loading ----------

  async function loadRooms(keyword) {
    try {
      const params = new URLSearchParams({ action: "list" });
      if (keyword) params.set("keyword", keyword);

      const res = await fetch(`${CONTROLLER_URL}?${params.toString()}`);
      const data = await res.json();

      if (data && data.error) {
        console.error("Error loading rooms:", data.error);
        currentRooms = [];
        renderRooms([]);
        return;
      }

      currentRooms = Array.isArray(data) ? data : [];
      renderRooms(currentRooms);
    } catch (err) {
      console.error("Failed to load rooms:", err);
      currentRooms = [];
      renderRooms([]);
    }
  }

  // ---------- Add / Edit modal ----------

  function resetRoomForm() {
    roomIdInput.value = "";
    roomNameInput.value = "";
    roomBuildingInput.value = "";
    roomCapacityInput.value = "";
    roomMsg.textContent = "";
    roomMsg.className = "form-msg";
  }

  function openAddModal() {
    resetRoomForm();
    roomModalTitle.textContent = "Add Room";
    openModal(roomModal);
    roomNameInput.focus();
  }

  function openEditModal(roomId) {
    const room = currentRooms.find((r) => String(r.room_id) === String(roomId));
    if (!room) return;

    resetRoomForm();
    roomModalTitle.textContent = "Edit Room";
    roomIdInput.value = room.room_id;
    roomNameInput.value = room.room_name;
    roomBuildingInput.value = room.building;
    roomCapacityInput.value = room.capacity;

    openModal(roomModal);
    roomNameInput.focus();
  }

  async function saveRoom() {
    const id       = roomIdInput.value;
    const name     = roomNameInput.value.trim();
    const building = roomBuildingInput.value.trim();
    const capacity = roomCapacityInput.value;

    if (!name || !building || !capacity || Number(capacity) <= 0) {
      roomMsg.textContent = "Please fill in all fields with a valid capacity.";
      roomMsg.className = "form-msg form-msg--error";
      return;
    }

    saveRoomBtn.disabled = true;
    roomMsg.textContent = "";
    roomMsg.className = "form-msg";

    const formData = new FormData();
    formData.append("action", id ? "update" : "create");
    if (id) formData.append("room_id", id);
    formData.append("room_name", name);
    formData.append("building", building);
    formData.append("capacity", capacity);

    try {
      const res = await fetch(CONTROLLER_URL, {
        method: "POST",
        body: formData
      });
      const text = await res.text();

      if (text.includes("SUCCESS")) {
        closeModal(roomModal);
        await loadRooms(searchInput.value.trim());
      } else {
        roomMsg.textContent = text.replace(/^(INSERT|UPDATE) FAILED:?\s*/, "") || "Save failed. Please try again.";
        roomMsg.className = "form-msg form-msg--error";
      }
    } catch (err) {
      console.error("Failed to save room:", err);
      roomMsg.textContent = "Something went wrong. Please try again.";
      roomMsg.className = "form-msg form-msg--error";
    } finally {
      saveRoomBtn.disabled = false;
    }
  }

  // ---------- Delete ----------

  function openDeleteConfirm(roomId) {
    const room = currentRooms.find((r) => String(r.room_id) === String(roomId));
    if (!room) return;

    pendingDeleteId = roomId;
    confirmName.textContent = `${room.room_name} — ${room.building}`;
    openModal(confirmModal);
  }

  async function deleteRoom() {
    if (!pendingDeleteId) return;

    confirmActionBtn.disabled = true;

    const formData = new FormData();
    formData.append("action", "delete");
    formData.append("room_id", pendingDeleteId);

    try {
      const res = await fetch(CONTROLLER_URL, {
        method: "POST",
        body: formData
      });
      const text = await res.text();

      if (text.includes("SUCCESS")) {
        closeModal(confirmModal);
        await loadRooms(searchInput.value.trim());
      } else {
        alert(text.replace(/^DELETE FAILED:?\s*/, "") || "Delete failed. Please try again.");
      }
    } catch (err) {
      console.error("Failed to delete room:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      confirmActionBtn.disabled = false;
      pendingDeleteId = null;
    }
  }

  // ---------- Event wiring ----------

  addRoomBtn.addEventListener("click", openAddModal);
  closeRoomModal.addEventListener("click", () => closeModal(roomModal));
  cancelRoomBtn.addEventListener("click", () => closeModal(roomModal));
  saveRoomBtn.addEventListener("click", saveRoom);

  closeConfirmModal.addEventListener("click", () => closeModal(confirmModal));
  cancelConfirmBtn.addEventListener("click", () => closeModal(confirmModal));
  confirmActionBtn.addEventListener("click", deleteRoom);

  [roomModal, confirmModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(modal);
    });
  });

  searchInput.addEventListener("input", () => {
    clearTimeout(searchDebounce);
    const value = searchInput.value.trim();
    if (searchClearBtn) searchClearBtn.hidden = value === "";
    searchDebounce = setTimeout(() => loadRooms(value), 300);
  });

  if (searchClearBtn) {
    searchClearBtn.addEventListener("click", () => {
      searchInput.value = "";
      searchClearBtn.hidden = true;
      loadRooms("");
    });
  }

  // ---------- Init ----------
  document.addEventListener("DOMContentLoaded", () => loadRooms());
  loadRooms();
})();