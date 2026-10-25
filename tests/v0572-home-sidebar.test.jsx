import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen,within} from "@testing-library/react";
import {readFile} from "node:fs/promises";
import {join} from "node:path";
import DeliveryRegistry from "../src/components/DeliveryRegistry.jsx";
import {createDeliveryState,createStudent,createWeek,writeDeliveryState,DELIVERY_KEY}
 from "../src/services/delivery-registry.js";
import {BACKUP_REMINDER_KEY,BACKUP_DAY} from "../src/services/backup-reminder.js";
const original=window.matchMedia;
afterEach(()=>{
 cleanup();localStorage.clear();vi.useRealTimers();
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:original});
});
function fixture({mobile=false,weeks=5}={}){
 Object.defineProperty(window,"matchMedia",{configurable:true,writable:true,value:vi.fn(q=>({
   matches:mobile&&q.includes("max-width: 760px"),
   addEventListener:vi.fn(),removeEventListener:vi.fn(),media:q,
 }))});
 const state=createDeliveryState();
 state.context={school:"CBTIS 134",generation:"2024-2027"};
 state.students=[createStudent({id:"a",name:"Alumna A",specialty:"Programación"})];
 state.weeks=Array.from({length:weeks},(_,i)=>createWeek({
   id:"week"+i,label:"Semana "+(i+1),startDate:"2026-09-"+String(i+1).padStart(2,"0"),
 }));
 writeDeliveryState(state);
}
describe("Inicio, accesos rápidos y respaldos · Registro Dual",()=>{
 it("separa el contenido de la barra sticky y anima únicamente el cambio de pestañas móvil",async()=>{
   fixture({mobile:true});
   const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
   const initial=screen.getByRole("main");
   expect(initial.classList.contains("delivery-page-transition")).toBe(true);
   const nav=screen.getByRole("navigation",{name:"Navegación móvil"});
   fireEvent.click(within(nav).getByRole("button",{name:"Semanas"}));
   const next=screen.getByRole("main");
   expect(next).not.toBe(initial);
   expect(next.classList.contains("delivery-page-transition")).toBe(true);
   const css=await readFile(join(process.cwd(),"src","delivery-mobile-polish.css"),"utf8");
   expect(css).toContain("padding-top:58px");
   expect(css).toContain("dualMobileViewEnter");
   expect(css).toContain("dualMobileGlassSweep");
   expect(css).toContain("dualMobileTabSelect");
   expect(css).toContain("@media(prefers-reduced-motion:reduce)");
   expect(css).toContain(".delivery-app.delivery-layout-mobile .delivery-page-transition");
 });
 it("no aplica transición de pestañas al diseño clásico de escritorio",()=>{
   fixture();
   render(<DeliveryRegistry onClose={vi.fn()}/>);
   const main=screen.getByRole("main");
   expect(main.classList.contains("delivery-page-transition")).toBe(false);
   fireEvent.click(screen.getByRole("button",{name:"Estadísticas"}));
   expect(screen.getByRole("main")).toBe(main);
 });

 it("Inicio enseña tres métricas balanceadas y únicamente las últimas tres semanas",()=>{
   fixture({mobile:true});
   const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
   const metrics=screen.getByRole("region",{name:"Indicadores de inicio"});
   expect(metrics.querySelectorAll(".delivery-summary-card")).toHaveLength(3);
   expect(within(metrics).getByText("Alumnos activos")).toBeTruthy();
   expect(within(metrics).getByText("Semanas")).toBeTruthy();
   expect(within(metrics).getByText("Última semana")).toBeTruthy();
   expect(metrics.textContent).toContain("Semana 5");
   expect(container.querySelectorAll(".delivery-home-history .delivery-week-row")).toHaveLength(3);
   fireEvent.click(screen.getByRole("button",{name:"Ver todas"}));
   expect(screen.getByRole("region",{name:"Listado de semanas"})).toBeTruthy();
   expect(screen.getAllByText("Semana 1").length).toBeGreaterThan(0);
 });
 it("barra lateral accede a datos, gestión y respaldo sin perder la navegación móvil",()=>{
   fixture({mobile:true});
   const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
   expect(screen.getByRole("navigation",{name:"Navegación móvil"})).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Abrir accesos rápidos"}));
   const sidebar=screen.getByRole("complementary",{name:"Accesos rápidos del registro"});
   expect(sidebar).toBeTruthy();
   expect(within(sidebar).getByRole("button",{name:"Acceso rápido: Datos"})).toBeTruthy();
   fireEvent.click(within(sidebar).getByRole("button",{name:"Acceso rápido: Datos"}));
   expect(container.querySelector('[data-view="statistics"]')).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Abrir accesos rápidos"}));
   fireEvent.click(within(sidebar).getByRole("button",{name:"Administrar alumnos"}));
   expect(container.querySelector('[data-view="setup"]')).toBeTruthy();
 });
 it("solo muestra recordatorio cuando hubo tiempo suficiente sin un respaldo",()=>{
   fixture({mobile:true});
   const raw=JSON.parse(localStorage.getItem(DELIVERY_KEY));
   const now=Date.now();
   raw.updatedAt=new Date(now-65*60*1000).toISOString();
   localStorage.setItem(DELIVERY_KEY,JSON.stringify(raw));
   localStorage.setItem(BACKUP_REMINDER_KEY,JSON.stringify({
     firstSeenAt:now-2*BACKUP_DAY,lastBackupAt:0,lastPromptAt:0,snoozedUntil:0,
   }));
   const {container}=render(<DeliveryRegistry onClose={vi.fn()}/>);
   const notice=screen.getByRole("status",{name:"Recordatorio de respaldo"});
   expect(notice).toBeTruthy();
   fireEvent.click(within(notice).getByRole("button",{name:"Recordar después"}));
   expect(container.querySelector(".delivery-backup-reminder")).toBeNull();
   const meta=JSON.parse(localStorage.getItem(BACKUP_REMINDER_KEY));
   expect(meta.snoozedUntil).toBeGreaterThan(now+BACKUP_DAY);
 });
});
