Main Specifications

- This is a Learning Analytics Dashboard. It must be designed for actionable insights. 
- You should use React and a good CSS Framework for client side. The backend just needs an API that can load and filter the data and make LLM calls and can be in Python. Choose good charting libs and datatables. Use as many as you need for the charts that are needed.
- The data for the dashboard is in the @data folder. These are the main csv files.
    - Course Enrolment: enrolled_students.csv
    This has 30 students with unique student usernames, first name, last name, degree program.

    - Course details: course_details.csv
    Just 1 entry with the course name - Web Information Systems and a Code WIS2002, start date and end date and no weeks which is 13 the 

    - Student GradeBook: gradebook.csv
    Grades for each of the students from enrolled_students.csv. There are columns from weekly activities from Week 2 to Week 8. There should be 3 assessment items a Design Document, Web Project and a Code Review. Not all students do all the assessment items. The exam should be blank as it is not yet completed. Weekly activities should have a grade out of 5. 

    - Applied Class Completions: appliedclassstats.csv
    1 or 0 to whether the student completed the applied class in each week. applied classes run from week 2 to 12.

    - Weekly LMS access: access.csv
    Weekly unique clicks per student on coursework each week.

- You should merge all the data so you have just 1 file to deal with for filtering. You should add a dummy email address for each student.

- The dashboard contains two screens. Screen 1 is a Filterable student List called "Find and Email". Screen 2 is a "Overview Dashboard" that contains a series of charts. 

- The "Find and Email" screen 
This has a filter at the top of the screen. It is well designed and intuitive. It should let the Educator build filter criteria across all the fields and then filter the list. eg by name, assessment score equal or less or greater than a value, for all the data. It would help if there was categories. Should support AND and OR login but in an intuitive way. There should be a way to reset a filter.
There should be a feature to email the students, with a text editor that has formatting and can include placeholders eg any of the filter criteria. Sending email should just be simulated. The text editor should include a few templates with well written text to support common use cases. Include GenAI functionality that the user can use to make LLM calls to help write the email based on a basic description and summary of the criteria available. Ask for an API key for OpenAI and then add it to a .env file that is not committed to the github repo. 
This screen is essentially what the On-Task LA tool supports. 
- "Overview Dashboard"
This screen should also have the filters, just like the "Find and Email" screen. It should display a bar chart of unique students accessing the course each week, a bar chart of no students completing the weekly activities each week, a bar chart of the no of students completing Applied Classes each week. There should be.a sankey diagram showing how students flow thru assessments, including weekly tasks + the 2 major assessment items. When a filter is applied there should be dual series across all charts.

- Functionality between screens. The filter if present, should be kept when swapping between screens. 
- The site should be intuitive, aesthetic and professionally designed. 
