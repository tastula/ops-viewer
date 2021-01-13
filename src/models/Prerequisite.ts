export default interface Prerequisite {
    type: string;
    // Subclass CourseUnitPrerequisite
    courseUnitGroupId?: string;
    // Subclass ModulePrerequisite
    moduleGroupId?: string;
}
