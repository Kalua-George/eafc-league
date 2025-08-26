// logs.js

async function loadLogs() {
    const container = document.getElementById("logsContent");
    container.innerHTML = "Loading logs...";

    try {
        const res = await fetch("../api/getLogs.php");
        if (!res.ok) throw new Error("Failed to load logs");
        const logs = await res.json();

        if (logs.length === 0) {
            container.innerHTML = "<p>No logs available.</p>";
            return;
        }

        // Build table
        let html = `
            <table border="1" cellpadding="5" cellspacing="0">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>User</th>
                        <th>Action</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
        `;

        logs.forEach(log => {
            html += `
                <tr>
                    <td>${log.id}</td>
                    <td>${log.user_id ?? "System"}</td>
                    <td>${log.action}</td>
                    <td>${log.created_at}</td>
                </tr>
            `;
        });

        html += "</tbody></table>";
        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
}

// Load logs when the section is opened
document.querySelector('button[data-section="logs"]')
    .addEventListener('click', loadLogs);
