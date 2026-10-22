---
# Answers as codes, for counting across squads. The questions and codes are in learning/questions.md.
name: Nicholas Davey
profession: Business Analyst
role: none
location: in person
# At setup
ai_use_before: 2
hopes: [see-claude, build-fast, other-jobs]
feeling: curious
# At 19:00
worked_on: []
outside_usual_job:
got_in_way: []
ai_use_after:
# In the week after
specialist:
helped_squad: []
idea_where: []
ai_use_week_after:
---

# Nicholas Davey: learning log

## At setup
- How much I use AI tools in my work today: Now and then
- What I'm hoping to get from the hackathon: See what Claude can do; Build something real, fast; Try work outside my usual job
- How I feel about using AI in my work: Curious

## During
<!-- Claude adds one line per moment: prompts that worked (word for word), dead ends, surprises, things done outside my usual job, what made working as a squad easier or harder -->
<!-- Times are when each change was shared (from git), not when the prompt was typed. -->
- Setup (Mon 19 Oct) dead end: installing GitHub's command line tool (gh) from its website → it didn't install on my laptop. Claude downloaded the official version, checked its fingerprint and installed it in my home folder instead.
- Setup (Mon 19 Oct) dead end: the GitHub sign-in in the terminal wouldn't let me type → Claude restarted the sign-in so I only needed the browser and a one-time code.
- Before 16:35 prompt: "Can you open the prototype please" → the in-app browser only showed a bare page, so Claude opened it in my normal browser.
- 16:35 prompt: "Could you update the latest version of the prototype to include a property management section where head office users can Add, Remove, Update & Delete properties. Allow the head office users to add info about the tenants in each property and enable them to be opted in & out of the app." → a new Properties screen with made-up tenants. Shared as pull request #12. This was snag 4.
- 16:39 prompt: "Can you make the properties section within the head office system so it can be accessed from that tab rather than it being its own system?" → Properties became a section of the Cloch head office tab, next to Homes at risk. Pull request #13.
- 16:49 prompt: "Can you update the information held on properties to include tennant age, if they are hard of seeing, & give an in-depth history of any checks or repairs relevant to mould for a property. To provide this we may need to see a bigger view than the side bar summary currently provided." → full-width property records with tenant age, sight loss and a damp and mould history timeline that staff can add to. Pull request #15.
- 16:49 squad: Dharmendra changed the same file at the same time (accessibility fixes) and changed how sensor readings work. Claude combined both, kept his fixes and updated my page to show the new readings.
- 16:55 prompt: "Please can you add filtering & a search to the properties and tenants tab?" → search, four filters and sorting, copying the look of Gavin's filters on Homes at risk. Pull request #20.
- 16:55 squad: Moji shared at the same moment. It combined cleanly and Claude re-checked both worked together before merging.
- 17:26 prompt: "Replace the "is an older person/younger person" info with specific age ranges also update the filters with this data" → how many people in each age range (0 to 5, 6 to 17, 18 to 64, 65 to 79, 80 or over), matched to Moji's tenant question, with filters for each. Pull request #24.
- 18:10 prompt that worked: "In a separate branch, please add a new tab for a housing officer's view of the system. Where they can see their current assignments, update them with investigation information, if a repair is required, if they have carried out/booked a repair as well as any other notes." → a Housing officer tab on its own branch, joined up with the tenant's "What we found" and the property history. Pull request #31.
- 18:10 surprise: while testing, Claude spotted that a repair booked for 29 October missed the Awaab's Law deadline to start it (28 October), so it added a warning for late bookings.
- 18:10 dead end: Claude made a mistake while tidying the styles and renamed two of Gavin's style rules. It noticed, put them back and checked nothing else had changed.
- 18:16 prompt: "Get the latest and merge my branch with the latest" → brought the squad's latest into my housing officer branch.
- 18:20 prompt: "Check again that you have the latest and merge to that" → merged the housing officer view into the shared copy. GitHub refused the first try because it hadn't caught up yet; it worked a minute later.
- 18:20 I built property management, property records, search and filters, and a housing officer view, normally a developer's job: I described what I wanted in plain words, and Claude did the building, testing and git.

## At 19:00
- What I worked on: <answers>
- How much of it was outside my usual job: <answer>
- What got in the way: <answers>
- How much I'd use AI tools in my work now: <answer>

## In the week after
- Did I still need a human specialist: <answer>, for <what>
- What helped most when building as a squad: <answers>
- The most useful thing I learned: <in my words>
- **One idea to carry forward:** <in my words>, and where it could fit: <answers>
- How much I expect to use AI tools from now on: <answer>

## Three-week check-in (around 12 Nov)
- Did I try, share or suggest my idea anywhere? What happened, or what got in the way?
