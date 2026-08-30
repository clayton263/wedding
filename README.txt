# Wedding RSVP Website

Open index.html in a browser to preview the invitation.
Files: index.html, style.css, script.js (the site) + google-apps-script.gs (RSVP storage helper).

## Customise
Names, date, time, and venue live in index.html — search for "Clayton" and
"Your Name" and swap them for the real names.

## Where do RSVPs get stored?
Right now, submitting the form just logs the answer in the browser console —
nothing is saved anywhere, because a plain HTML/CSS/JS site has no server of
its own. The easiest fix, and what this site is already wired for, is to have
it write straight into a Google Sheet using a free Apps Script "web app".
Every RSVP lands as a new row: Timestamp, Name, Attending, Dietary
requirements, Notes.

### Set it up (10 minutes, no coding needed beyond copy/paste)
1. Create a new Google Sheet (sheets.new) and name it something like
   "Wedding RSVPs".
2. In the Sheet, go to Extensions -> Apps Script.
3. Delete any placeholder code, then paste in the contents of
   google-apps-script.gs (included alongside this file).
4. Click Deploy -> New deployment. Choose type "Web app".
   - Execute as: Me
   - Who has access: Anyone
5. Click Deploy. Google will ask you to authorise it — click through
   (it's your own script, this is normal for personal Apps Scripts).
6. Copy the Web app URL you're given (ends in /exec).
7. Open script.js in this project, find the line:
     const GOOGLE_SCRIPT_URL = "";
   and paste your URL between the quotes.
8. Re-upload/host the updated script.js. Every RSVP will now appear as a
   new row in your Google Sheet automatically, ready to filter and sort
   like a normal spreadsheet.

If you ever want to move to Excel instead: open the Google Sheet and use
File -> Download -> Microsoft Excel (.xlsx) at any time — no extra setup
needed, since it's just a live spreadsheet in the meantime.

## Alternative if you'd rather not touch Apps Script
Swap the custom form for a Google Form (Google Forms -> auto-collects
into a linked Sheet with zero code), or use a form backend service like
Formspree — either works, but you'd lose the current custom styling
unless you keep this HTML and just point it at their endpoint the same
way as GOOGLE_SCRIPT_URL above.

## Structure
The site is deliberately split into HTML/CSS/JS so the design can be
changed easily without touching the RSVP logic.

Current features:
- One scroll-driven envelope at the top of the page that opens as you
  scroll, revealing the invitation letter below it
- Wedding details (date, time, venue)
- Map/directions section — Sparth House, Whalley Road, Clayton le Moors,
  Lancashire BB5 5RP
- RSVP form with attendance, dietary requirements, and an allergy/notes field
- Mobile responsive layout
- Google Sheets integration hook (see above)
