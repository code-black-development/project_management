"use client";

import { minutesToTimeEstimateString } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserTimeReport } from "@/lib/dbService/reports";
import MemberAvatar from "@/features/members/_components/member-avatar";

interface UserTimeTableProps {
  users: UserTimeReport[];
}

export const UserTimeTable = ({ users }: UserTimeTableProps) => {
  const sortedUsers = [...users].sort(
    (a, b) => b.totalLoggedMinutes - a.totalLoggedMinutes
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Logged by User</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedUsers.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No time has been logged by any users yet.
            </div>
          ) : (
            sortedUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <MemberAvatar
                    name={user.name || user.email}
                    className="size-10"
                  />
                  <div>
                    <div className="font-medium">
                      {user.name || "Unnamed User"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {user.totalLoggedMinutes > 0
                      ? minutesToTimeEstimateString(user.totalLoggedMinutes)
                      : "No time logged"}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {user.tasksWorkedOn} task
                    {user.tasksWorkedOn !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
