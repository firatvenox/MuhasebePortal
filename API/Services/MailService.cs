using API.Entities;
using API.Handler;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Mail;
using System.Text;

namespace API.Services
{
    public class MailService
    {
        public void SendKritikStokMail(List<string> toList)
        {
            var handler = new KritikStoklar();
            List<KritikStok> stoklar = handler.Handle();

            if (stoklar == null || stoklar.Count == 0)
            {
                Console.WriteLine("[WARN] Gönderilecek kritik stok bulunamadı.");
                return;
            }

            // === HTML tabloyu hazırla ===
            var sb = new StringBuilder();
            sb.Append("<h3>Kritik Stok Listesi</h3>");
            sb.Append("<table border='1' cellspacing='0' cellpadding='5' style='border-collapse:collapse;'>");
            sb.Append("<tr><th>Parça</th><th>Miktar</th><th>Emniyet Stok</th></tr>");

            foreach (var s in stoklar)
            {
                sb.Append("<tr>");
                sb.Append($"<td>{s.Parca.ToString()}</td>");
                sb.Append($"<td>{s.Miktar}</td>");
                sb.Append($"<td>{s.Emniyet}</td>");
                sb.Append("</tr>");
            }

            sb.Append("</table>");
            string htmlBody = sb.ToString();

            // === Mail ayarları ===
            var msg = new MailMessage
            {
                From = new MailAddress("kuika@ermetal.com", "Ergıda Kritik Stok Bildirimi", Encoding.UTF8),
                Subject = "Ergıda Kritik Stok Bildirimi",
                Body = htmlBody,
                IsBodyHtml = true
            };

            foreach (var to in toList)
                msg.To.Add(to);

            // Bcc
            msg.Bcc.Add("kuika@ermetal.com");

            var smtp = new SmtpClient
            {
                Credentials = new NetworkCredential("kuika@ermetal.com", "C#106148071718op"),
                Port = 25,
                EnableSsl = true,
                Host = "smtp.office365.com"
            };

            smtp.Send(msg);

            Console.WriteLine("[INFO] Mail gönderildi.");
        }
    }
}
