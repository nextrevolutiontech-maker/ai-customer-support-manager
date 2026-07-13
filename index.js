import jsonfile from "jsonfile";
import moment from "moment";
import simpleGit from "simple-git";

const git = simpleGit();

const path = "./data.json";

const startDate = moment("2025-01-01");
const endDate   = moment("2025-12-31");

const commitDay = async (date) => {
  const data = { date: date.format() };

  await jsonfile.writeFile(path, data);

  await git.add([path]);
  await git.commit(
    date.format("YYYY-MM-DD"),
    { "--date": date.format() }
  );
};

const run = async () => {
  let current = startDate.clone();

  while (current.isSameOrBefore(endDate)) {
    // 1 commit per day (green guaranteed)
    await commitDay(current);

    // agar dark green chahiye to:
    // await commitDay(current);
    // await commitDay(current);

    current.add(1, "day");
  }

  await git.push();
  console.log("✅ 2025 fully green ho gaya");
};

run();
