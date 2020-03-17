# Czech food delivery(Košík.cz) free time slots checker

The scraper checks available time slots to deliver food from [Košík.cz](https://kosik.cz).
It sends you mail every time new slot appears.

Free time slots are changing during a day, and the company doesn't have any watchdog to check this.
It should help you to check it automatically without visiting the website the whole day.

## Usage

You can easily set it up on Apify platform.

1. You need to click on the "Try for free" button on [this page](http://apify.com/drobnikj/czech-food-delivery-checker).
2. Fill all fields on the page where you will be redirected.
3. Set up Scheduler to run this task periodically.
    - Go to [Schedules on Apify](https://my.apify.com/schedules).
    - Create a new button
    - Set "Cron expression" to @hourly
    - Go to Tasks tab in your schedule
    - Add task -> Find your task and Save :tada:
    
## Warning

Please do not set up the scheduler too hardly. We don't want to overload kosik.cz page.
