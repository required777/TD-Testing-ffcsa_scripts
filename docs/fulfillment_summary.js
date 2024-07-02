$(document).ready(function() {
    let jsonData; // Variable to hold JSON data

    // Fetch JSON data using AJAX
    $.ajax({
        url: 'https://raw.githubusercontent.com/jdeck88/ffcsa_scripts/main/localline/data/fulfillment_kpi.json',
        dataType: 'json',
        success: function(data) {
            jsonData = data; // Store JSON data for later use

            // Populate dropdown menu with fulfillmentNames
            const dropdownMenu = $('#dropdownMenu');
            const fulfillmentNames = getFulfillmentNames(data.weeks);

            fulfillmentNames.forEach((name, index) => {
                dropdownMenu.append(`<a class="dropdown-item" href="#" data-index="${index}">${name}</a>`);
            });

            // Handle click on dropdown item
            dropdownMenu.on('click', '.dropdown-item', function(e) {
                e.preventDefault();
                const index = $(this).data('index');
                const fulfillmentName = fulfillmentNames[index];

                // Display selected fulfillmentName at the top of the table
                $('#selectedFulfillmentName').text(fulfillmentName);

                // Filter data for selected fulfillmentName
                const filteredData = filterDataByFulfillmentName(jsonData.weeks, fulfillmentName);

                // Update table with filtered data
                updateTable(filteredData);
            });

            // Initialize DataTable with empty data
            $('#fulfillmentTable').DataTable({
                data: [],
                columns: [
                    { data: 'dateRange' },
                    { data: 'total' },
                    { data: 'count' }
                ],
                paging: false,
                searching: false,
                info: false
            });
        },
        error: function(xhr, status, error) {
            console.error('Error fetching data:', error);
        }
    });

    // Function to extract unique fulfillmentNames
    function getFulfillmentNames(weeks) {
        const names = new Set();
        weeks.forEach(week => {
            week.data.forEach(entry => {
                names.add(entry.fulfillmentName);
            });
        });
        return Array.from(names);
    }

    // Function to filter data by fulfillmentName
    function filterDataByFulfillmentName(weeks, fulfillmentName) {
        const filteredData = [];
        weeks.forEach(week => {
            week.data.forEach(entry => {
                if (entry.fulfillmentName === fulfillmentName) {
                    filteredData.push({
                        dateRange: week.dateRange,
                        total: entry.total,
                        count: entry.count
                    });
                }
            });
        });
        return filteredData;
    }

    // Function to update DataTable with new data
    function updateTable(data) {
        const table = $('#fulfillmentTable').DataTable();
        table.clear().rows.add(data).draw();
    }
});

