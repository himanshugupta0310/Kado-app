function openVetModal(kadoId) {
  activeKadoId = kadoId;
  document.getElementById("vet-note").value = "";
  document.getElementById("vet-modal").classList.add("open");
}
function closeVetModal() {
  document.getElementById("vet-modal").classList.remove("open");
}
function openEditModal(kadoId, existing) {
  activeKadoId = kadoId;
  document.getElementById("edit-text").value = existing || "";
  document.getElementById("edit-modal").classList.add("open");
}
function closeEditModal() {
  document.getElementById("edit-modal").classList.remove("open");
}
function openInfoModal(kadoId) {
  activeKadoId = kadoId;
  document.getElementById("info-question").value = "";
  document.getElementById("info-modal").classList.add("open");
}
function closeInfoModal() {
  document.getElementById("info-modal").classList.remove("open");
}

async function submitReview(status) {
  const body = { doctor_status: status };
  if (status === "vetted") {
    body.doctor_note = document.getElementById("vet-note").value.trim() || null;
    closeVetModal();
  } else if (status === "edited") {
    body.doctor_edit = document.getElementById("edit-text").value.trim();
    if (!body.doctor_edit) return;
    closeEditModal();
  } else if (status === "needs_info") {
    body.needs_info_question = document
      .getElementById("info-question")
      .value.trim();
    if (!body.needs_info_question) return;
    closeInfoModal();
  }
  try {
    await apiPatch("/kado-cards/" + activeKadoId + "/review", body);
  } catch (e) {
    alert("Could not save review.");
  }
}
