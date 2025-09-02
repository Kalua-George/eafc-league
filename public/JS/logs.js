// logs.js

async function loadLogs(page = 1) {
    const container = document.getElementById("logsContent");
    container.innerHTML = "Loading logs...";
    const limit = 50; // You can adjust this

    try {
        const res = await fetch(`../api/systemlogs/getlogs.php?page=${page}&limit=${limit}`);
        if (!res.ok) throw new Error("Failed to load logs");
        const data = await res.json();
        const logs = data.logs;

        if (logs.length === 0) {
            container.innerHTML = "<p>No logs available.</p>";
            return;
        }

        // Build table
        let html = `
            <style>
                #logsContent table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                #logsContent th, #logsContent td {
                    padding: 0.75rem;
                    text-align: left;
                    border: 1px solid #e2e8f0;
                }
                #logsContent thead {
                    background-color: #f1f5f9;
                }
                #logsContent tr:nth-child(even) {
                    background-color: #f8fafc;
                }
                #logsContent .pagination-controls {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 1rem;
                    margin-top: 1rem;
                }
                #logsContent .pagination-controls button {
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    border: 1px solid #cbd5e1;
                    background-color: #fff;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                #logsContent .pagination-controls button:disabled {
                    background-color: #f1f5f9;
                    cursor: not-allowed;
                    color: #94a3b8;
                }
            </style>
            <div class="overflow-x-auto">
                <table class="min-w-full">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Admin ID</th>
                            <th>Action</th>
                            <th>Target Table</th>
                            <th>Target ID</th>
                            <th>Status</th>
                            <th>Details</th>
                            <th>Created At</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        logs.forEach(log => {
            html += `
                <tr>
                    <td>${log.id}</td>
                    <td>${log.admin_id ?? "System"}</td>
                    <td>${log.action}</td>
                    <td>${log.target_table}</td>
                    <td>${log.target_id ?? 'N/A'}</td>
                    <td>${log.status}</td>
                    <td>${log.details}</td>
                    <td>${log.created_at}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div class="pagination-controls">
                <button 
                    onclick="loadLogs(${data.page - 1})"
                    ${data.page <= 1 ? 'disabled' : ''}>
                    Previous
                </button>
                <span>Page ${data.page} of ${data.total_pages}</span>
                <button 
                    onclick="loadLogs(${data.page + 1})"
                    ${data.page >= data.total_pages ? 'disabled' : ''}>
                    Next
                </button>
            </div>
        `;

        container.innerHTML = html;

    } catch (err) {
        container.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
        console.error(err);
    }
}

// Load logs when the section is opened
document.querySelector('button[data-section="logs"]')
    .addEventListener('click', () => loadLogs());
