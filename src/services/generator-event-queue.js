/** Cola de eventos que conserva el perfil y la fecha original de cada mensaje. */
export const eventQueueKey = item => [item.event.id,item.event.revision,
  item.ctx.profileId||"unassigned",item.ctx.date||""].join(":");

export function retainEventsForContext(queue,{profileId="",date=""}={}){
  return queue.filter(item=>item.kind==="final-bitacora" ||
    (item.ctx.profileId===profileId && item.ctx.date===date));
}
export function enqueueEventMessages(queue,events,ctx,kind,active=null){
  const known=new Set(queue.map(eventQueueKey));
  if(active)known.add(eventQueueKey(active));
  const result=[...queue];
  for(const event of events){
    const item={event,ctx:{...ctx,profile:{...ctx.profile}},kind};
    const key=eventQueueKey(item);
    if(known.has(key))continue;
    known.add(key);result.push(item);
  }
  return result.sort((a,b)=>(b.event.priority||0)-(a.event.priority||0) ||
    a.event.id.localeCompare(b.event.id));
}
/** Una despedida final desplaza temporalmente avisos ordinarios sin marcarlos como vistos. */
export function prioritizeFinalEvent(queue,active,finalItem){
  const pending=active&&active.kind!=="final-bitacora"
    ?enqueueEventMessages(queue,[active.event],active.ctx,active.kind):[...queue];
  const key=eventQueueKey(finalItem);
  return [finalItem,...pending.filter(item=>eventQueueKey(item)!==key)];
}
export function takeNextEvent(queue,{profileId="",date="",wasSeen=()=>false}={}){
  const remaining=[...queue];
  while(remaining.length){
    const candidate=remaining.shift();
    if(candidate.kind!=="final-bitacora" &&
       (candidate.ctx.profileId!==profileId || candidate.ctx.date!==date))continue;
    if(wasSeen(candidate.event,candidate.ctx))continue;
    return {next:candidate,queue:remaining};
  }
  return {next:null,queue:[]};
}
