document.addEventListener("DOMContentLoaded", function() {
    const apiUrl = 'https://raw.githubusercontent.com/jdeck88/ffcsa_scripts/main/localline/data/weekly_kpi.json';

    // Function to populate weekly KPI table
    function populateWeeklyKpiTable(data) {
        const tableBody = document.querySelector('#weeklyKpiTable tbody');
        tableBody.innerHTML = '';

        data.weeks.forEach(week => {
            const row = `<tr>
                            <td>${week.dateRange}</td>
                            <td>${week.data.totalSales}</td>
                            <td>${week.data.numOrders}</td>
                            <td>${week.data.numSubscriberOrders}</td>
                            <td>${week.data.numGuestOrders}</td>
                            <td>${week.data.averageItemsPerOrder}</td>
                            <td>${week.data.averageOrderAmount}</td>
                            <td>${week.data.totalActiveSubscribers}</td>
                            <td>${week.data.projectedMonthlySubscriptionRevenue}</td>
                        </tr>`;
            tableBody.innerHTML += row;
        });

        // Initialize DataTables.js for weekly KPI table
        $('#weeklyKpiTable').DataTable({
            paging: true,
            searching: true,
            pageLength: 10, // Set default number of entries per page
            lengthMenu: [10, 25, 50, 100], // Customize entries per page menu
            order: [[0, 'desc']], // Default sorting by date range descending
            columns: [
                null, // Date Range
                { render: $.fn.dataTable.render.number(',', '.', 2, '$') }, // Total Sales with formatting
                null, // Number of Orders
                null, // Number of Subscriber Orders
                null, // Number of Guest Orders
                null, // Average Items per Order
                { render: $.fn.dataTable.render.number(',', '.', 2, '$') }, // Average Order Amount with formatting
                null, // Total Active Subscribers
                { render: $.fn.dataTable.render.number(',', '.', 0, '$') } // Projected Monthly Subscription Revenue with formatting
            ]
            // More options as needed
        });
    }

    // Fetch data and populate the table
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            populateWeeklyKpiTable(data);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});

