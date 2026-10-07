// EDIT ALL OF THIS with your real details
export const BRAND={name:'Treehouse Cookery',open:12,close:19,hoursText:'Mon to Fri, 12pm to 7pm',
 address:'Metropolitan Estate, Chiromo, Nairobi',mapQuery:'Treehouse Nairobi',maps:'https://maps.app.goo.gl/nLC1UCkfrKHVvrxw7?g_st=ic',
 phone:'+254720752762',wa:'254720752762',email:'inquiries@treehouse.com'};
// Index 0 = Sunday ... 6 = Saturday. [openHour, closeHour] in 24h time, or null if closed.
export const HOURS:([number,number]|null)[]=[null,[12,19],[12,19],[12,19],[12,19],[12,19],null];
// EDIT: how to reach you
export const GETTING_HERE:[string,string][]=[
 ['By matatu or bus','Tell customers the nearest stage and the route numbers that stop closest to you.'],
 ['Taxi or ride-hailing','Give a landmark to use as the drop-off point, like a well-known building or junction.'],
 ['Driving','Explain the approach road and any one-way streets or tricky turns.'],
 ['Parking','Say where customers can park, whether it is free, and how many spaces there are.']];
export const GOOD_TO_KNOW:[string,string][]=[
 ['Do I need a reservation?','Walk-ins are welcome. For groups of 4 or more, or busy evenings, reserving a table is a good idea.'],
 ['Can I order ahead and collect?','Yes. Order online, pay with M-Pesa and pick up with your order number. No queue.'],
 ['Is there step-free access?','Add details of step-free access, accessible restrooms and any other help you offer.'],
 ['Do you take cards and cash?','Add the payment methods you accept in the restaurant.'],
 ['Are you good for kids and groups?','Add details about high chairs, group seating and family-friendly options.']];