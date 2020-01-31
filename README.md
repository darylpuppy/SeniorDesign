# WorkforcePlanningTool

MediaKind sponsored Workforce Planning Tool

Two default user credentials:

- Username: SuperUser

- Password: Workforce1!

- Username: RegularUser

- Password: Workforce1!


SETTING UP AWS TO WORK WITH CODE:

To Host the website follow the following link, create an S3 bucket, and paste all the files found in the repository.
https://aws.amazon.com/getting-started/projects/build-serverless-web-app-lambda-apigateway-s3-dynamodb-cognito/module-1/

To create an Identity Pool follow the link
https://docs.aws.amazon.com/cognito/latest/developerguide/tutorial-create-identity-pool.html

Finally, change the following files to reflect the new S3 bucket name, bucket region, and identity pool ID.
Files with AWS info that must be edited:
- accounts.js
- manage-users.js
- get-plans.js
- file.js

FUTURE IMPROVEMENTS:
- Fix plan view so that it displays the sums of counts per plan page
- Due to time constraints security is lacking, especially with how users are stored / managed
- Copy and pasting from plans
- Things in accounts.js may be redundant when downloading the user file
- End user testing would help iron out remaining bugs and issues
- Logging would be very easy to implement: the user name is already stored, just need to log the time whenever a plan is edited

THINGS TO KNOW:
 - There are currently two types of users: Regular Users and Super Users. Regular Users can only read and edit plans. Super users can create plans, delete plans, and change the permissions of other users.
 - The log-in page says Email, but its more of a username, can be anything. Also, there are no requirements for passwords. Both of these can be changed in accounts.js to meet business needs. 
 - When editing a plan, after editing the last cell the user must press enter or click elsewhere on the screen for that last cell value to save correctly. 
 - When a super user manages users, they can change permissions to anything, but only "S" and "R" are recognized. Nothing will break if a random permission value is assigned, but the user will basically just have regular user permissions. 
