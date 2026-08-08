# Campus Connect Market

# Software Requirements Specification (SRS)

# SwapSpace

## Buy. Rent. Sell.

Version: 1.0.0

Document Type:
Software Requirements Specification

Status:
Draft


---

# 1. Introduction


## 1.1 Purpose of This Document


This document explains how the SwapSpace platform should work from a software perspective.

The purpose of this document is to clearly define:

- What features the system should have.
- How users interact with the system.
- How different parts of the application should behave.
- What rules the system should follow.


This document will be used by:

- Developers
- Designers
- Testers
- Product team
- AI development tools


---

# 1.2 About SwapSpace


SwapSpace is a campus-exclusive marketplace platform that allows students to:

- Buy products
- Rent products
- Sell products


within their college community.


The platform helps students find affordable products, sell unused items, and rent items they only need temporarily.


Unlike general marketplaces, SwapSpace focuses on:

- Student verification
- Campus trust
- Easy communication
- Community-based transactions


---

# 1.3 Scope of the System


The SwapSpace system contains two major parts:


## 1. Student Platform


Used by students for:

- Creating accounts
- Managing profiles
- Browsing products
- Searching products
- Buying items
- Renting items
- Selling items
- Chatting with users
- Rating users


---

## 2. Admin Portal


Used by administrators for:

- Managing users
- Approving listings
- Handling reports
- Managing banners
- Monitoring platform activity


---

# 2. System Overview


## 2.1 How SwapSpace Works


The basic flow:


Student creates account

↓

Student completes profile

↓

Student enters marketplace

↓

Student browses products

↓

Student contacts seller

↓

Students communicate through chat

↓

Transaction happens offline

↓

Users rate each other


---

# 2.2 Important Note About Payments


SwapSpace will NOT handle payments in the initial version.


The platform only provides:

- Product discovery
- Communication
- Connection between students


The actual payment and physical exchange happen between students.


---

# 2.3 Technology Overview


The system will use:


## Frontend

Next.js

Purpose:

Used to create the user interface and screens.


---

## Programming Language

TypeScript

Purpose:

Helps write safer and more organized code.


---

## Backend

Supabase

Purpose:

Handles:

- Database
- Authentication
- Realtime features


---

## Database

PostgreSQL

Purpose:

Stores:

- Users
- Products
- Messages
- Ratings
- Reports


---

## Image Storage

Cloudinary

Purpose:

Stores:

- Profile pictures
- Product images
- Banner images


---

## Hosting

Vercel

Purpose:

Makes the website available online.



---

# 3. User Roles


SwapSpace has three types of users:


# 3.1 Guest User


A person who visits SwapSpace without creating an account.


## Guest User Can:


- View landing page
- View basic product information


## Guest User Cannot:


- Contact sellers
- Sell products
- Rent products
- Add wishlist items
- Send messages



---

# 3.2 Student User


A registered student using SwapSpace.


## Student Can:


### Account

- Create account
- Login
- Update profile


### Marketplace

- Browse products
- Search products
- Filter products
- View categories


### Buying

- View product details
- Contact seller
- Chat with seller


### Selling

- Upload products
- Edit listings
- Remove listings


### Renting

- Create rental listings
- Receive rental requests


### Community

- Rate users
- Report users
- Manage wishlist



---

# 3.3 Admin User


Admin manages the complete platform.


Admin can:


## User Management

- Verify students
- Remove verification
- Suspend users
- Ban users


## Listing Management

- Approve listings
- Remove listings
- Feature listings


## Safety

- Review reports
- Check reported chats


## Platform Management

- Manage categories
- Manage event banners
- Send notifications


---
# 4. Functional Requirements


Functional requirements describe what the system should do.

Each requirement explains:

- What the feature does.
- How the user interacts with it.
- What the system should handle.


---

# 4.1 Authentication System


## Purpose

The authentication system allows students to create accounts and securely access SwapSpace.


---

# FR-001: Student Registration


## Description

The system should allow new students to create a SwapSpace account.


## Required Information


The signup form should collect:


### Full Name

Purpose:

Identify the student.


### Email Address

Purpose:

Used for login and communication.


### Password

Purpose:

Secure account access.


### Confirm Password

Purpose:

Prevent incorrect password creation.


### Terms and Conditions

User must accept before creating an account.



---

## Registration Flow


User clicks:

"Sign Up"


↓

System displays signup form.


↓

User enters details.


↓

System validates information.


↓

Account is created.


↓

User moves to profile completion.



---

## Validation Rules


The system should check:


### Email

- Email should be in valid format.
- Duplicate emails should not be allowed.


### Password

- Password should meet minimum security requirements.
- Password and confirm password should match.


### Required Fields

All mandatory fields must be completed.


---

# FR-002: User Login


## Description

Allows existing students to access their account.


## Required Information


- Email
- Password


---

## Login Flow


User enters credentials.


↓

System checks details.


↓

If correct:

User enters homepage.


If incorrect:

Show error message.


---

# FR-003: Password Reset


## Description

Allows users to recover their account.


Flow:


User selects:

"Forgot Password"


↓

User enters email.


↓

System sends reset instructions.


↓

User creates a new password.



---

# 4.2 Profile Management System


## Purpose

Stores student information and builds trust between users.


---

# FR-004: Profile Creation


After signup, users must complete their profile.


---

## Profile Information


The system should collect:


### Profile Picture

User can upload:

- Camera image
- Gallery image
- File upload


---

### Name

Automatically taken from signup.


---

### Bio

Optional description about the user.


Example:

"2nd year IT student interested in technology."


---

# FR-005: Profile Editing


Users should be able to update:


- Profile picture
- Bio
- Personal information


---

# FR-006: Student Verification Badge


## Purpose

Create trust within the college community.


The system supports:


## Vishnu Student Verified Badge


The badge is assigned by admin after verification.


---

Verification Status:


Pending

↓

Verified

↓

Rejected



---

# 4.3 Marketplace System


## Purpose

Allows students to discover products.


---

# FR-007: Home Marketplace


When a student opens the homepage, the system should display:


## Header


Contains:


Left side:

- SwapSpace logo
- SwapSpace name


Right side:

- Notification icon
- Message icon



---

## Search Section


Contains:


Search bar

Purpose:

Find products quickly.


Filter option:

Allows filtering based on:

- Category
- Price
- Buy/Rent
- Condition



---

## Category Section


Displays available product categories.


Examples:


- Electronics
- Books
- Fashion
- Hostel Essentials
- Sports
- Stationery
- Cycles
- Others



---

## Event Banner Section


Purpose:

Promote college events and related products.


Example:


During a hackathon:

Display:

"Hackathon Essentials Sale"


Admin controls banners.



---

## Product Feed


Displays available listings.


Each product card should show:


- Product image
- Product name
- Price
- Buy/Rent label
- Wishlist button
- Trending badge (if applicable)



---

# FR-008: Search Functionality


The system should allow users to search products.


Search should work using:


- Product name
- Category
- Keywords


Example:


Searching:

"calculator"


Should show:

Calculator-related products.



---

# FR-009: Product Filtering


Users should filter products by:


## Category


Example:

Electronics


---

## Price Range


Example:

₹100 - ₹1000


---

## Listing Type


Options:


- Buy
- Rent


---

## Condition


Options:


- Brand New
- Like New
- Good
- Fair
- Used



---

# 4.4 Category System


## Purpose

Organize products properly.


---

# FR-010: Category Browsing


When user opens categories:


The system should show:


Left side:

Scrollable category list.


Right side:

Products from selected category.



---

# Category Examples


Electronics

Books

Fashion

Hostel Essentials

Sports Equipment

Stationery

Lab Equipment

Cycles

Others



---

# 4.5 Product Details System


## Purpose

Show complete product information before contacting seller.


---

# FR-011: Product Detail Page


The system should display:


## Product Images


- Main image
- Additional images
- Image slider



---

## Product Information


Display:


- Product name
- Price
- Listing type
- Condition
- Description



---

## Seller Information


Display:


- Profile picture
- Seller name
- Verification badge
- Tomato rating



---

## Action Button


For selling:


Button:

"Contact Seller"


For renting:


Button:

"Request Rental"



---
# 4.6 Product Listing System


## Purpose

Allows students to upload items they want to sell or rent.


A listing represents a product available on SwapSpace.


---

# FR-012: Create New Listing


## Access


Only registered students with completed profiles can create listings.


---

# Listing Creation Flow


Student clicks:

"Add Item"


↓

System opens listing form.


↓

Student enters product details.


↓

Student uploads images.


↓

Student submits listing.


↓

Listing goes for approval.


↓

Admin reviews listing.


↓

Listing becomes visible.



---

# Required Listing Information


## Product Images


User should be able to upload:


- Camera images
- Gallery images
- File uploads


Rules:

- Multiple images allowed.
- Images should have preview.
- User can remove uploaded images.


---

## Product Category


User must select one category.


Examples:


- Electronics
- Books
- Fashion
- Hostel Essentials
- Sports
- Stationery


---

## Listing Type


User selects:


## Sell


For products that users want to sell permanently.


Example:

Old laptop


---

## Rent


For products available temporarily.


Example:

Scientific calculator for one semester



---

## Product Name


Required field.


Example:


"Casio FX-991ES Calculator"



---

## Description


User provides:


- Product details
- Usage history
- Additional information



---

## Product Condition


Fixed options:


- Brand New
- Like New
- Good
- Fair
- Used



---

# Selling Details


If listing type is Sell:


Required:


- Selling price



Example:

₹800



---

# Rental Details


If listing type is Rent:


Additional fields:


## Rental Price


Example:

₹50/day


---

## Rental Duration


Options:


- Per Day
- Per Week
- Per Month



---

## Security Deposit


Optional.


Example:

₹500



---

## Availability Period


User can specify:


Available From

Available Until



---

# FR-013: Listing Approval System


## Purpose

Maintain quality and safety of products.


---

# Listing Status


Every listing should have a status.


Possible states:


## Draft


User has started but not published.


↓

## Pending Approval


Waiting for admin review.


↓

## Approved


Visible to students.


↓

## Rejected


Not displayed.


↓

## Completed


Transaction finished.


↓

## Archived


Removed from active marketplace.



---

# Admin Approval Flow


Student creates listing.


↓

System marks:

Pending Approval


↓

Admin reviews:


- Images
- Description
- Category
- Product authenticity


↓

Admin approves or rejects.


---

# FR-014: Manage Own Listings


Users should have a "My Listings" section.


Users can:


- View active listings
- Edit listings
- Delete listings
- Mark item as sold
- Mark item as unavailable for rent



---

# 4.7 Buying System


## Purpose

Allow students to contact sellers for purchasing products.


---

# FR-015: Buy Product Flow


User opens product.


↓

User clicks:

"Contact Seller"


↓

Chat opens.


↓

Buyer and seller communicate.


↓

Transaction happens offline.


↓

Both users can rate experience.



---

# Important Rule


SwapSpace does not process payments.


The platform only connects students.



---

# 4.8 Rental System


## Purpose

Allow students to request temporary usage of products.


---

# FR-016: Rental Request Flow


User opens rental product.


↓

Clicks:

"Request Rental"


↓

Chat opens.


↓

User discusses:

- Rental duration
- Price
- Pickup


↓

Rental happens offline.


↓

Users rate experience.



---

# Rental Status


Possible states:


Available

↓

Rental Requested

↓

Rented

↓

Returned



---

# 4.9 Wishlist System


## Purpose

Allow users to save interesting products.


---

# FR-017: Add Product To Wishlist


User can click heart icon on product cards.


System should:


- Save product
- Show it in wishlist


---

# Wishlist Page


Displays:


- Product image
- Product name
- Price
- Listing type


Users can:


- Remove item
- Open product



---

# 4.10 Cart System


## Purpose

Allow users to collect products they are interested in.


---

# FR-018: Add Product To Cart


Users can add products to cart.


Cart stores:


- Product
- Seller
- Price
- Listing type



---

# Cart Actions


User can:


- Remove product
- View product
- Contact seller



---

# Important Note


Cart does not complete payment.


It only works as a collection tool for interested products.



---

# 4.11 Messaging System


## Purpose

Allow buyers and sellers to communicate.


---

# FR-019: Chat Creation


Chat starts when:


- User contacts seller
- User requests rental


---

# Chat Contains


- User messages
- Product reference
- Images
- Time stamps


---

# Chat Flow


Buyer contacts seller.


↓

Conversation created.


↓

Messages exchanged.


↓

Transaction completed.


---

# Chat Status


Chat can have:


Active

Completed

Reported



---
# 4.12 Real-Time Messaging System


## Purpose

Provide direct communication between students for buying and renting products.


The messaging system helps students discuss:

- Product details
- Price
- Availability
- Meeting details
- Rental duration



---

# FR-020: Real-Time Chat


When a user sends a message:


1. Message should be stored.
2. Receiver should get notification.
3. Chat should update without refreshing the page.


---

# Chat Interface Requirements


The chat screen should contain:


## Header


Displays:


- User profile picture
- User name
- Verification badge
- Product reference


---

## Message Area


Displays:


- Sent messages
- Received messages
- Time of message
- Message status



---

## Message Input


Contains:


- Text input
- Image attachment option
- Send button



---

# FR-021: Report Chat


Users can report inappropriate conversations.


Report reasons:


- Scam attempt
- Harassment
- Spam
- Misleading information


---

# Chat Privacy Rule


Normal private conversations cannot be accessed by admins.


Admins can only view conversations that are reported.



---

# 4.13 Notification System


## Purpose


Keep users updated about important activities.


---

# FR-022: User Notifications


The system should generate notifications for:


## Account Activities


Examples:


- Account verification completed
- Profile updates


---

## Listing Activities


Examples:


- Listing approved
- Listing rejected
- Product marked completed


---

## Marketplace Activities


Examples:


- New message
- Rental request
- Seller response


---

## Platform Updates


Examples:


- New features
- Campus announcements
- Event promotions



---

# Notification Display


Each notification should contain:


- Icon
- Title
- Description
- Time
- Read/unread status



---

# Notification Types


## Instant Notifications


Examples:


- New message
- Rental request


---

## Scheduled Notifications


Examples:


- Event announcements
- Promotions



---

# 4.14 Rating System


## Purpose


Create trust between students.


---

# FR-023: Tomato Rating System


SwapSpace uses a tomato-based rating system instead of stars.



Example:


🍅🍅🍅🍅🍅


---

# When Rating Happens


Rating is available after:


- Completed purchase
- Completed rental


---

# Rating Categories


Users can rate:


## Communication


Was the person responsive?


---

## Product Accuracy


Was the product as described?


---

## Transaction Experience


Was the process smooth?



---

# Review Option


Users can add optional written feedback.


Example:


"Product was in excellent condition."



---

# User Rating Display


Profile shows:


- Tomato rating
- Number of completed transactions
- Reviews



---

# 4.15 Reporting System


## Purpose


Maintain a safe marketplace environment.



---

# FR-024: User Reports


Users can report:


## Products


Reasons:


- Fake listing
- Wrong information
- Spam


---

## Users


Reasons:


- Scam
- Harassment
- Misbehavior


---

## Messages


Reasons:


- Abuse
- Fraud attempt



---

# Report Flow


User submits report.


↓

Report stored.


↓

Admin reviews.


↓

Admin takes action.



---

# Report Status


Possible states:


Pending

↓

Under Review

↓

Resolved

↓

Rejected



---

# 5. Admin Portal Requirements


## Purpose


Allow administrators to manage and maintain SwapSpace.



---

# 5.1 Admin Authentication


Only authorized administrators can access the admin portal.


Admin account:


Email:

admin@swapspace.in



---

# 5.2 Admin Dashboard


Dashboard should display:


## Platform Statistics


- Total users
- Active listings
- Completed transactions
- Pending reports
- New registrations



---

# 5.3 User Management


Admin can:


- View users
- Search users
- Verify students
- Remove verification
- Suspend users
- Ban users



---

# 5.4 Listing Management


Admin can:


- View all listings
- Approve listings
- Reject listings
- Remove listings
- Feature listings



---

# 5.5 Verification Management


Admin reviews:


- Student information
- Verification requests


Admin actions:


Approve

Reject



---

# 5.6 Report Management


Admin can:


- View reports
- Check details
- Take action
- Close reports



---

# 5.7 Banner Management


Admin can create event banners.


Banner information:


- Image
- Title
- Description
- Start date
- End date



---

# 5.8 Notification Management


Admin can send:


- General announcements
- Event notifications
- Important updates



---

# 5.9 Audit Logs


The system should record admin actions.


Example:


Admin:

Sneha


Action:

Approved listing


Time:

31 July 2026



---

# 6. Business Rules


## Rule 1

Only registered students can access marketplace features.


---

## Rule 2

Only approved listings appear publicly.


---

## Rule 3

SwapSpace does not handle payments.


---

## Rule 4

Users are responsible for offline transactions.


---

## Rule 5

Admin has final authority over moderation decisions.


---
# 7. Database Requirements


## Purpose

The database stores and manages all information required for SwapSpace.


The database should be designed to:

- Store user data safely.
- Connect users with their listings.
- Store messages and notifications.
- Maintain platform activity history.



---

# 7.1 Main Database Entities


The system will contain the following major data collections:



# Users


## Purpose

Stores basic account information.


Contains:


- User ID
- Full name
- Email
- Password information
- Account status
- Verification status
- Created date



---

# Profiles


## Purpose

Stores additional user details.


Contains:


- User ID
- Profile picture
- Bio
- Tomato rating
- Trust score
- Transaction count



---

# Listings


## Purpose

Stores products uploaded by students.


Contains:


- Listing ID
- Seller ID
- Product name
- Description
- Category
- Listing type
- Price
- Condition
- Status
- Created date



---

# Listing Images


## Purpose

Stores product image references.


Contains:


- Image ID
- Listing ID
- Cloudinary image URL



---

# Categories


## Purpose

Organizes marketplace products.


Contains:


- Category ID
- Category name
- Category image
- Status



---

# Wishlist


## Purpose

Stores products saved by users.


Contains:


- Wishlist ID
- User ID
- Listing ID



---

# Cart


## Purpose

Stores products users want to revisit.


Contains:


- Cart ID
- User ID
- Listing ID



---

# Conversations


## Purpose

Stores chat conversations between users.


Contains:


- Conversation ID
- Buyer ID
- Seller ID
- Listing ID
- Created date



---

# Messages


## Purpose

Stores chat messages.


Contains:


- Message ID
- Conversation ID
- Sender ID
- Message content
- Timestamp



---

# Ratings


## Purpose

Stores user feedback.


Contains:


- Rating ID
- Reviewer ID
- Reviewed user ID
- Tomato rating
- Review text



---

# Reports


## Purpose

Stores user complaints.


Contains:


- Report ID
- Reporter ID
- Reported user/listing
- Reason
- Status
- Created date



---

# Notifications


## Purpose

Stores user notifications.


Contains:


- Notification ID
- User ID
- Title
- Message
- Read status
- Created date



---

# Event Banners


## Purpose

Stores promotional banners.


Contains:


- Banner ID
- Image
- Title
- Description
- Start date
- End date



---

# Admin Logs


## Purpose

Tracks admin actions.


Contains:


- Log ID
- Admin ID
- Action
- Target
- Timestamp



---

# 8. System Security Requirements


## Purpose


Protect user accounts, data, and platform activity.



---

# 8.1 User Account Security


The system should:


- Secure passwords.
- Protect user sessions.
- Prevent unauthorized login attempts.
- Allow password recovery.



---

# 8.2 Access Control


Different users should have different permissions.



Example:


Student:

Can edit own listing.


Cannot:

Edit another student's listing.



Admin:

Can moderate all listings.



---

# 8.3 Data Protection


The system should protect:


- Personal information
- Messages
- Account details


Only required information should be visible publicly.



---

# 8.4 Image Security


Uploaded images should:


- Be validated.
- Have size restrictions.
- Be stored securely.


Cloudinary will manage image storage.



---

# 8.5 Database Security


The system should use:


## Row Level Security (RLS)


Purpose:


Control who can access database information.



Example:


A student can view their own messages but cannot view another student's private chats.



---

# 9. Error Handling Requirements


## Purpose


Provide clear messages when something goes wrong.



---

# Authentication Errors


Examples:


Wrong password:


Message:

"Incorrect email or password."


---

Account already exists:


Message:

"An account with this email already exists."



---

# Listing Errors


Examples:


Missing product image:


Message:

"Please upload at least one product image."


---

Missing price:


Message:

"Please enter product price."



---

# Network Errors


If internet connection fails:


Message:


"Unable to connect. Please try again."



---

# 10. Performance Requirements


The system should:


## Loading Speed


- Open pages quickly.
- Optimize images.
- Reduce unnecessary loading.



---

## Marketplace Performance


The system should support:


- Large number of products.
- Multiple users browsing simultaneously.
- Smooth scrolling.



---

## Chat Performance


Messages should:

- Send quickly.
- Appear instantly.
- Maintain chat history.



---

# 11. Testing Requirements


The application should be tested for:


---

# Functional Testing


Check whether:


- Signup works.
- Login works.
- Products can be uploaded.
- Chat works.
- Notifications work.



---

# User Interface Testing


Check:


- Mobile responsiveness.
- Button behaviour.
- Navigation.
- Layout consistency.



---

# Security Testing


Check:


- Unauthorized access.
- Data protection.
- Admin permissions.



---

# Performance Testing


Check:


- Loading speed.
- Database performance.
- Multiple user handling.



---

# 12. Future Enhancements


Future versions may include:


## Online Payments


Allow secure transactions inside SwapSpace.


---

## Delivery Support


Campus-based delivery system.


---

## AI Recommendations


Suggest products based on:

- User interest
- Search history
- Previous activity



---

## Multiple College Expansion


Allow multiple campuses to use SwapSpace.


---

## Advanced Fraud Detection


Automatically detect suspicious listings and users.



---

# 13. Final Summary


SwapSpace is designed as a trusted campus marketplace where students can:

- Buy products.
- Rent products.
- Sell products.


The system focuses on:

- Trust
- Simplicity
- Student community
- Secure communication


This SRS defines how the application should behave and provides the foundation for development.


---

# End of Software Requirements Specification

Version 1.0

# Developer Implementation Plan

# SwapSpace

## Buy. Rent. Sell.

Version: 1.0.0


---

# 1. Introduction


## Purpose


This document defines the development roadmap for building SwapSpace.


It converts the product documentation into practical development phases.



---

# 2. Development Approach


SwapSpace will be developed using an MVP-first approach.


The goal:


Build a functional marketplace for one college first.


Then improve based on student feedback.



---

# 3. Development Phases Overview



Phase 1
Project Setup
   ↓

Phase 2
Authentication & Profiles
   ↓

Phase 3
Marketplace
   ↓

Phase 4
Listings
   ↓

Phase 5
Chat System
   ↓

Phase 6
Admin Portal
   ↓

Phase 7
Testing & Deployment


---

# Phase 1: Project Setup


## Goal


Create the foundation of the application.



---

# Tasks


## Frontend Setup


Create:


- Next.js project.
- TypeScript configuration.
- Tailwind CSS setup.
- Component structure.



---

## Backend Setup


Create:


- Supabase project.
- Database connection.
- Environment variables.



---

## Storage Setup


Configure:


- Cloudinary account.
- Image upload system.



---

## Version Control


Setup:


- Git repository.
- Branch structure.



---

# Initial Folder Structure



SwapSpace
|
|-- frontend
|
|-- backend
|
|-- docs
|
|-- assets


---

# Phase 2: Authentication System


## Goal


Allow students to create and access accounts.



---

# Features


Build:


## Signup


Fields:


- Name.
- Email.
- Password.
- Confirm password.



---

## Login


Features:


- Email login.
- Password authentication.



---

## Profile Completion


Implement:


- Profile picture.
- Bio.
- User details.



---

## User Roles


Create:


Student


Admin



---

# Phase 3: Marketplace Core


## Goal


Create the main shopping experience.



---

# Features


## Home Page


Build:


- Navbar.
- Search.
- Categories.
- Event banners.
- Product feed.



---

## Product Cards


Implement:


- Product image.
- Name.
- Price.
- Wishlist button.
- Category badge.



---

## Search


Implement:


- Keyword search.
- Category filtering.



---

# Phase 4: Listing System


## Goal


Allow students to upload products.



---

# Features


## Add Item Page


Implement:


- Image upload.
- Category selection.
- Buy/Rent selection.
- Description.
- Condition.
- Price.



---

## Cloudinary Integration


Flow:



User uploads image
↓
Cloudinary storage
↓
Save URL in database


---

## Admin Approval


Listing workflow:



Created
↓
Pending
↓
Approved
↓
Visible


---

# Phase 5: Product Interaction


## Goal


Allow users to interact with products.



---

# Features


## Product Details Page


Implement:


- Images.
- Description.
- Seller profile.
- Verification badge.
- Tomato rating.



---

## Wishlist


Implement:


- Add product.
- Remove product.
- View wishlist.



---

## Cart


Implement:


- Save products.
- Contact seller.



---

# Phase 6: Chat System


## Goal


Enable buyer-seller communication.



---

# Features


## Conversation Creation


When user clicks:


Contact Seller


Create conversation.



---

## Real-Time Messaging


Using:


Supabase Realtime



---

## Message Features


Implement:


- Text messages.
- Images.
- Read status.



---

# Phase 7: Rating System


## Goal


Build trust between users.



---

# Features


After transaction:


Allow:


- Tomato rating.
- Written review.



---

# Phase 8: Admin Portal


## Goal


Give control over marketplace.



---

# Features


## Dashboard


Implement:


- Users count.
- Listings count.
- Reports.



---

## User Management


Implement:


- Verification.
- Suspension.
- Ban.



---

## Listing Management


Implement:


- Approve.
- Reject.
- Remove.



---

## Reports


Implement:


- View reports.
- Resolve issues.



---

## Banner Management


Implement:


- Create event banners.
- Schedule banners.



---

# Phase 9: Testing


## Functional Testing


Test:


- Signup.
- Login.
- Upload.
- Chat.
- Notifications.



---

## Security Testing


Check:


- Database permissions.
- User access.
- Admin access.



---

## UI Testing


Check:


- Mobile view.
- Desktop view.
- Responsive behaviour.



---

# Phase 10: Deployment


## Production Setup


Deploy:


Frontend:

Vercel



Backend:

Supabase



Images:

Cloudinary



---

# 4. MVP Feature Priority


## Must Have


Build first:


✅ Authentication

✅ Profiles

✅ Product Listings

✅ Search

✅ Categories

✅ Product Details

✅ Chat

✅ Admin Approval



---

# Nice To Have


Later:


- AI recommendations.
- Advanced analytics.
- Payment system.
- Mobile app.



---

# 5. Recommended Development Order



Database Setup
Authentication
UI Foundation
Marketplace
Listing Upload
Admin Approval
Chat
Ratings
Notifications
Deployment


---

# 6. MVP Launch Checklist


Before launch:


## User Side


☐ Signup works

☐ Profile completion works

☐ Products visible

☐ Users can upload products

☐ Chat works

☐ Ratings work



---

## Admin Side


☐ Login works

☐ Approvals work

☐ Reports work

☐ User management works



---

## Technical


☐ Database secured

☐ Images optimized

☐ Website deployed

☐ Error handling added



---

# End of Developer Implementation Plan


Version:

1.0.0


Product:

SwapSpace

Buy. Rent. Sell.



Now we create the API Documentation.
This document explains how the frontend communicates with Supabase/backend.
Create a new file:
SwapSpace_API_Documentation_v1.0.md


# API Documentation

# SwapSpace

## Buy. Rent. Sell.

Version: 1.0.0



---

# 1. Introduction


## Purpose


This document defines the API structure used by SwapSpace.



It explains:


- Available API operations.
- Required inputs.
- Expected responses.
- Authentication requirements.



---

# 2. API Architecture


SwapSpace uses:


## Backend

Supabase


## Database

PostgreSQL


## Storage

Cloudinary



---

# API Communication Flow



Frontend
|

↓

Supabase API
|

↓

Database
|

↓

Response
|

↓

Frontend Update



---

# 3. Authentication APIs


Authentication is handled by:

Supabase Authentication



---

# 3.1 User Signup


## Purpose


Create a new student account.



## Method


POST



## Endpoint



/auth/signup



---

## Request Body


```json
{
 "email": "student@gmail.com",
 "password": "password123"
}
``` id="n4s8qa"



---

## Response


Success:


```json
{
 "message": "Account created successfully",
 "user_id": "uuid"
}
``` id="m6x2kp"



---

# 3.2 User Login


## Endpoint



/auth/login



---

## Request


```json
{
 "email":"student@gmail.com",
 "password":"password123"
}
``` id="r8y4dc"



---

## Response


```json
{
 "token":"session_token",
 "user_id":"uuid"
}
``` id="t6m2vk"



---

# 3.3 Logout


## Endpoint



/auth/logout



---

# 4. User Profile APIs


---

# 4.1 Get Profile


## Purpose


Retrieve user profile information.



## Method


GET



## Endpoint



/profile/{user_id}



---

## Response


```json
{
"name":"Sneha",
"bio":"IT Student",
"rating":5,
"verified":true
}
``` id="z5n7qp"



---

# 4.2 Update Profile


## Method


PUT



## Endpoint



/profile/update



---

## Request


```json
{
"bio":"Tech enthusiast",
"profile_image":"cloudinary_url"
}
``` id="u7s4rm"



---

# 5. Marketplace APIs


# 5.1 Get Products


## Purpose


Display marketplace products.



## Method


GET



## Endpoint



/products



---

## Query Parameters


Examples:



category=electronics
type=rent
search=laptop



---

## Response


```json
[
 {
 "name":"Laptop",
 "price":30000,
 "type":"sell"
 }
]
``` id="j5r8nx"



---

# 5.2 Get Product Details


## Endpoint



/products/{id}



---

## Response


```json
{
"name":"Calculator",
"description":"Used for one semester",
"price":500,
"seller":"Rahul"
}
``` id="f9x3qm"



---

# 6. Listing APIs


# 6.1 Create Listing


## Purpose


Upload a new product.



## Method


POST



## Endpoint



/listing/create



---

## Request


```json
{
"title":"Scientific Calculator",
"description":"Good condition",
"type":"sell",
"price":800,
"category":"electronics"
}
``` id="b8q5ma"



---

## Response


```json
{
"message":"Listing submitted for approval",
"status":"pending"
}
``` id="w6n3sd"



---

# 6.2 Update Listing


## Method


PUT



## Endpoint



/listing/{id}/update



---

# 6.3 Delete Listing


## Method


DELETE



## Endpoint



/listing/{id}



---

# 7. Wishlist APIs


# 7.1 Add Wishlist Item


## Endpoint



/wishlist/add



---

## Request


```json
{
"user_id":"uuid",
"listing_id":"uuid"
}
``` id="d9s3mw"



---

# 7.2 Get Wishlist


## Endpoint



/wishlist/{user_id}



---

# 8. Cart APIs


# 8.1 Add To Cart


## Endpoint



/cart/add



---

# 8.2 Get Cart


## Endpoint



/cart/{user_id}



---

# 9. Chat APIs


# 9.1 Create Conversation


## Endpoint



/chat/create



---

## Request


```json
{
"buyer_id":"uuid",
"seller_id":"uuid",
"listing_id":"uuid"
}
``` id="h5p7qm"



---

# 9.2 Send Message


## Endpoint



/chat/message



---

## Request


```json
{
"conversation_id":"uuid",
"message":"Is this available?"
}
``` id="m3q8vz"



---

# 9.3 Get Messages


## Endpoint



/chat/{conversation_id}



---

# 10. Rating APIs


# 10.1 Submit Rating


## Endpoint



/rating/create



---

## Request


```json
{
"user_id":"uuid",
"tomatoes":5,
"review":"Great experience"
}
``` id="y3p8mx"



---

# 11. Report APIs


# 11.1 Create Report


## Endpoint



/report/create



---

## Request


```json
{
"type":"listing",
"reason":"Fake product",
"description":"Incorrect information"
}
``` id="c7m9qw"



---

# 12. Notification APIs


# 12.1 Get Notifications


## Endpoint



/notifications/{user_id}



---

# 12.2 Mark Notification Read


## Endpoint



/notification/read/{id}



---

# 13. Admin APIs


# 13.1 Approve Listing


## Endpoint



/admin/listing/approve/{id}



---

# 13.2 Reject Listing


## Endpoint



/admin/listing/reject/{id}



---

# 13.3 Verify User


## Endpoint



/admin/user/verify/{id}



---

# 13.4 Manage Reports


## Endpoint



/admin/reports



---

# 14. API Security Rules


All protected APIs require:


- Valid authentication session.
- User permission verification.
- Supabase RLS checks.



---

# 15. Error Response Format


All APIs should return consistent errors.



Example:


```json
{
"success":false,
"message":"Unauthorized access"
}
``` id="p8v2kx"



---

# 16. Status Codes


| Code | Meaning |
|-|-|
|200|Success|
|201|Created|
|400|Bad Request|
|401|Unauthorized|
|403|Forbidden|
|404|Not Found|
|500|Server Error|



---

# End of API Documentation


Version:

1.0.0


Product:

SwapSpace

Buy. Rent. Sell.

Now we create the final bridge between your documentation and AI design tools.
This document is the AI UI Generation Master Prompt.
This is not a technical document. This is the instruction file you give to:
Lovable
v0
Figma AI
Framer AI
Galileo AI
Any UI generation model
It converts your complete product idea into a design prompt.
Create:
SwapSpace_AI_UI_Generation_Master_Prompt_v1.0.md


# SwapSpace AI UI Generation Master Prompt

## Product Name

SwapSpace


## Tagline

Buy. Rent. Sell.


## Product Category

Campus-exclusive marketplace platform.


---

# 1. Design Objective


Design a premium, modern, student-focused marketplace web application called SwapSpace.


The platform allows college students to:


- Buy products.
- Rent products.
- Sell products.


The experience should combine:


- Marketplace simplicity like Amazon.
- Modern startup aesthetics like Linear.
- Community trust like Facebook Marketplace.
- Youth-focused campus identity.



---

# 2. Brand Identity


Use the provided SwapSpace Brand Kit.


The brand kit contains:


- Logo.
- Typography.
- Color palette.
- Mascots.
- Brand pattern.
- Icons.



IMPORTANT:


Do not create a new logo.


Do not change typography.


Use the provided brand identity consistently across all screens.



---

# 3. Overall Design Style


Create a UI that feels:


- Premium.
- Minimal.
- Modern.
- Trustworthy.
- Student-friendly.
- Fast.


Design language:


- Rounded cards.
- Clean spacing.
- Soft shadows.
- Smooth animations.
- Modern typography.
- Clear hierarchy.



Avoid:


- Generic ecommerce templates.
- Old marketplace designs.
- Overcrowded layouts.



---

# 4. Platform Structure


Design the following screens:



## User Application


1. Landing Screen

2. Signup Screen

3. Profile Completion Screens

4. Home Marketplace

5. Product Details

6. Chat

7. Add Item

8. Categories

9. Wishlist

10. Cart

11. Profile

12. Notifications



---

# 5. Landing Screen


Create a full-screen premium opening page.



Background:


Use SwapSpace pattern.



Pattern behaviour:


- Strong/thicker pattern at top.
- Gradually fades and becomes thinner towards bottom.
- Gradient style.



Center:


Large SwapSpace logo.


Below:


SwapSpace typography.



Bottom:


Two buttons:


Primary:

Register / Sign Up


Secondary:

Login



Animation:


- Logo fade in.
- Pattern reveal.
- Buttons slide upward.



---

# 6. Signup Screen


Create a clean onboarding page.



Fields:


- Full Name.
- Email.
- Password.
- Confirm Password.
- Terms and Conditions checkbox.



Navigation:


Next button on top right.



---

# 7. Profile Completion Screens


## 50% Completion Screen


Show:


SwapSpace logo.


Animated circular progress.


Text:


50% Profile Completed.



---

## Profile Setup Screen


Include:


- Profile picture upload.
- Editable name.
- Bio section.


Next button:


Top right.



---

## 100% Completion Screen


Show:


Animated logo.


Text:


100% Completed.


Welcome to SwapSpace.



Then redirect to marketplace.



---

# 8. Home Marketplace Screen


Design similar to modern ecommerce applications.



Top Navigation:


Left:


SwapSpace logo + typography.


Right:


- Notifications icon.
- Messages icon.



Below:


Search bar.



Include:


- Search button.
- Filter button.



---

# Categories Section


Horizontal scrolling categories.


Examples:


- Electronics.
- Books.
- Fashion.
- Hostel Essentials.
- Sports.
- Stationery.



---

# Event Banner Section


Create promotional event banners.



Purpose:


College event-based selling.



Example:


"Freshers Essentials Sale"



---

# Product Feed


Create modern marketplace cards.



Each card contains:



Top left:

Badge:


- Trending.
- Best Seller.
- New.



Top right:

Wishlist heart icon.



Middle:

Product image.



Bottom:


Product name.


Price.


Buy/Rent label.



---

# Bottom Navigation


Fixed navigation.



Five options:



1. Account

2. Categories

3. Add Item (center highlighted)

4. Cart

5. Wishlist



---

# 9. Product Details Screen


Create detailed product view.



Include:


Large product gallery.


Verification badge.



Product information:


- Name.
- Price.
- Condition.
- Description.



Seller section:


Include:


- Profile image.
- Name.
- Vishnu Student Verified badge.
- Tomato rating.



CTA:


Primary button:


Buy Product


or


Rent Product



---

# 10. Chat Screen


Create WhatsApp-style conversation interface.



Include:


Header:


- Seller profile.
- Product reference.



Chat area:


Message bubbles.



Bottom:


- Text input.
- Image upload.
- Send button.



Above input:


Transaction status toggle:


ON / OFF



---

# 11. Add Item Screen


Create product upload flow.



Include:


Image upload:


- Camera.
- Gallery.
- Files.



Fields:


- Category.
- Buy/Rent selection.
- Product name.
- Description.
- Condition.
- Price.



Submit button:


List Item.



---

# 12. Categories Screen


Layout:


Split screen.



Left:


Scrollable category list.



Right:


Products from selected category.



---

# 13. Wishlist Screen


Display saved products.



Use product cards.



Include:


Empty state illustration.



---

# 14. Cart Screen


Remember:


No payment system.



Cart is only for interested products.



CTA:


Contact Seller.



---

# 15. Profile Screen


Include:


Profile image.


Name.


Verification badge.


Bio.



Statistics:


- Tomato rating.
- Completed transactions.
- Active listings.



Menu:


- My Listings.
- My Rentals.
- Settings.
- Support.
- Logout.



---

# 16. Notification Screen


Create notification centre.



Cards should show:


- Icon.
- Title.
- Message.
- Time.
- Read status.



---

# 17. Admin Portal Design


Create separate professional dashboard.



Admin email:


admin@swapspace.in



---

# Admin Dashboard


Include:


Sidebar:


- Dashboard.
- Users.
- Listings.
- Reports.
- Banners.
- Notifications.
- Logs.



Dashboard cards:


- Total users.
- Active listings.
- Pending approvals.
- Reports.



---

# Admin Listing Approval


Create review interface.



Show:


- Product images.
- Seller information.
- Description.



Actions:


Approve.

Reject.

Feature.



---

# Admin User Management


Show:


- User details.
- Verification.
- Trust score.
- Ratings.



Actions:


Verify.

Suspend.

Ban.



---

# Admin Reports


Show:


Reported users/products/chats.



Actions:


Resolve.

Warn.

Suspend.



---

# Final Design Rules


Always maintain:


- SwapSpace branding.
- Consistent spacing.
- Modern UI components.
- Mobile-first experience.
- Responsive desktop support.



The final output should look like a real funded startup product, not a college project.



With this document, your AI designer has the complete context.
Your next actual build step after UI generation would be:
Frontend Architecture Document
Next.js folder structure
Components list
State management
Supabase integration plan
Cloudinary setup
Deployment flow
That will directly guide coding.

give me a proper prompt to generate this project

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://swapspace.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/187ed9b4-5089-4985-aea4-bb8c7d3f1893).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
