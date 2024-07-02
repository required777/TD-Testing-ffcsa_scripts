document.addEventListener("DOMContentLoaded", function() {
    const apiUrl = 'https://raw.githubusercontent.com/jdeck88/ffcsa_scripts/main/localline/data/weekly_kpi.json';

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const weeks = data.weeks;

            // Sort weeks by date in descending order
            weeks.sort((a, b) => new Date(b.dateRange.split(' to ')[1]) - new Date(a.dateRange.split(' to ')[1]));

            // Generate table HTML
            const table = document.createElement('table');
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Date Range</th>
                        <th>Total Sales</th>
                        <th>Number of Orders</th>
                        <th>Subscriber Orders</th>
                        <th>Guest Orders</th>
                        <th>Average Items Per Order</th>
                        <th>Average Order Amount</th>
                        <th>Total Active Subscribers</th>
                        <th>Projected Monthly Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    ${weeks.map(week => `
                        <tr>
                            <td>${week.dateRange}</td>
                            <td>${week.data.totalSales}</td>
                            <td>${week.data.numOrders}</td>
                            <td>${week.data.numSubscriberOrders}</td>
                            <td>${week.data.numGuestOrders}</td>
                            <td>${week.data.averageItemsPerOrder}</td>
                            <td>${week.data.averageOrderAmount}</td>
                            <td>${week.data.totalActiveSubscribers}</td>
                            <td>${week.data.projectedMonthlySubscriptionRevenue}</td>
                        </tr>
                    `).join('')}
                </tbody>
            `;

            // Append table to document body or specific container
            document.body.appendChild(table);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});

