document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.replaceChildren(activitySelect.options[0]);

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsCard = document.createElement("div");
        participantsCard.className = "participants-card";

        const participantsHeading = document.createElement("p");
        const participantsLabel = document.createElement("strong");
        participantsLabel.textContent = "Participantes inscritos:";
        participantsHeading.appendChild(participantsLabel);

        const participantsList = document.createElement("ul");
        if (details.participants.length > 0) {
          details.participants.forEach((email) => {
            const participant = document.createElement("li");
            const participantRow = document.createElement("div");
            participantRow.className = "participant-row";

            const participantEmail = document.createElement("span");
            participantEmail.textContent = email;

            const removeButton = document.createElement("button");
            removeButton.className = "participant-remove-button";
            removeButton.type = "button";
            removeButton.textContent = "🗑️";
            removeButton.setAttribute("aria-label", `Excluir ${email} de ${name}`);
            removeButton.title = `Excluir ${email} de ${name}`;
            removeButton.addEventListener("click", async () => {
              try {
                const response = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(email)}`,
                  { method: "DELETE" }
                );
                const result = await response.json();

                if (!response.ok) {
                  throw new Error(result.detail || "Não foi possível excluir o participante.");
                }

                messageDiv.textContent = result.message;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                await fetchActivities();
              } catch (error) {
                messageDiv.textContent = error.message || "Não foi possível excluir o participante.";
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
              }
            });

            participantRow.append(participantEmail, removeButton);
            participant.appendChild(participantRow);
            participantsList.appendChild(participant);
          });
        } else {
          const emptyMessage = document.createElement("li");
          emptyMessage.textContent = "Nenhum participante inscrito";
          participantsList.appendChild(emptyMessage);
        }

        participantsCard.append(participantsHeading, participantsList);
        activityCard.appendChild(participantsCard);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
