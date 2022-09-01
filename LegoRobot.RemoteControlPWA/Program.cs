using Microsoft.AspNetCore.Builder;

namespace LegoRobot.RemoteControlPWA
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);
            var app = builder.Build();
            app.UseDefaultFiles();
            app.UseStaticFiles();
            app.Run();
        }
    }
}