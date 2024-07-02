document.addEventListener("DOMContentLoaded", function() {
    const apiUrl = 'https://raw.githubusercontent.com/jdeck88/ffcsa_scripts/main/localline/data/fulfillment_kpi.json';

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            const weeks = data.weeks;

            // Extracting data for chart
            const labels = weeks.map(week => week.dateRange);
            const totalSales = weeks.map(week => parseFloat(week.data.totalSales));
            const numOrders = weeks.map(week => week.data.numOrders);
            const averageOrderAmount = weeks.map(week => parseFloat(week.data.averageOrderAmount));

            // Creating the chart
            const ctx = document.getElementById('salesChart').getContext('2d');
            const chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Total Sales',
                            data: totalSales,
                            borderColor: 'rgba(75, 192, 192, 1)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Number of Orders',
                            data: numOrders,
                            borderColor: 'rgba(153, 102, 255, 1)',
                            backgroundColor: 'rgba(153, 102, 255, 0.2)',
                            fill: false,
                            tension: 0.1
                        },
                        {
                            label: 'Average Order Amount',
                            data: averageOrderAmount,
                            borderColor: 'rgba(255, 159, 64, 1)',
                            backgroundColor: 'rgba(255, 159, 64, 0.2)',
                            fill: false,
                            tension: 0.1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Date Range'
                            }
                        },
                        y: {
                            display: true,
                            title: {
                                display: true,
                                text: 'Values'
                            }
                        }
                    }
                }
            });
        })
        .catch(error => {
            console.error('Error fetching data:', error);
        });
});

